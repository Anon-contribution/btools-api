import fs from 'fs/promises';
import { exec } from 'node:child_process';
import express from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import passport from 'passport'
import bcrypt from "bcrypt"
import bodyParser from 'body-parser';
import { eq } from 'drizzle-orm';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { db } from './src/db/db.js';
import { users } from './src/db/users.js';
import { extractUploadedFile } from './src/utils/files.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json())
app.use(passport.initialize());

const upload = multer({ dest: '/tmp/uploads/' });
/**
 * expected header { "X-Api-Key": 'YOUR_API_KEY' }
 */
passport.use(new HeaderAPIKeyStrategy(null, false,
  async function(apikey, done) {
    try {
      const [ result ] = await db.select().from(users).where(eq(users.api_key, apikey));
      if (!result) {
        return done(null, false);
      }
      return done(null, result, { scope: 'all' });
    } catch (error) {
      return done(error);
    }
  }
));


/**
 * POST /register
 * {
 *   "username": "user@example.com",
 *   "password": "myPassword"
 * }
 */
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing username or password.' });
  }
  try {
    const [ user ] = await db.select().from(users).where(eq(users.email, email));
    if(user) {
      return res.status(409).json({ error:  'user already exists' });
    }

    // Hash du password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Génération API_KEY unique
    const api_key = randomUUID();

    const workspace = `/tmp/workspaces/${api_key}`;
    await fs.mkdir(workspace, { recursive: true });
    console.log(`👉 user workspace created : ${workspace}`);

    await db.insert(users).values({
      email: email,
      password: hashedPassword,
      api_key: api_key,
    });

    return res.json(api_key);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// TODO refactor this
app.post('/prompt',passport.authenticate('headerapikey', { session: false }), upload.single('file'),
  async (req, res) => {
  // TODO validate prompt input
  const { prompt } = req.body;
  const workspaceId = req.user.api_key;
  const workspace = `/tmp/workspaces/${workspaceId}`;
  console.log(`👉 workspace : ${workspace}`);
  if(req.file) {
    try {
      await extractUploadedFile(req.file, workspace)
    } catch (error) {
      res.status(400).json(`Error: ${error}`);
    }
  }
  try {
    // Call mcphost script with workspace
    const userScript = './mcphost.sh'; // Path to your script file
    const execCommand = `mcphost script ${userScript} --args:workspace "${workspace}" --args:prompt "${prompt}" --debug`;

    const LLMoutput = await new Promise((resolve, reject) => {
      exec(execCommand, async (err, stdout, stderr) => {
        // Cleaning temp workspace
        await fs.rm(`${workspace}/*`, { recursive: true, force: true });
        if (err) {
          reject(stderr || stdout);
        } else {
          resolve(stdout);
        }
      });
    });
    res.status(200).send(LLMoutput);
  } catch (err) {
    console.error(`❌ Error handling request: ${err}`);
    res.status(500).send(`Error: ${err}`);
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend listening on http://localhost:${port}`);
});
