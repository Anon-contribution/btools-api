#!/usr/bin/env -S mcphost script
---
mcpServers:
  blockchain:
    type: "local"
    command: ["npx", "-y", "btools-mcp-server"]
    environment:
      DEBUG: "${env://DEBUG:-false}"
  filesystem:
    type: "local"
    command: ["npx", "-y", "@modelcontextprotocol/server-filesystem", "${workspace}"]

model: "${env://MODEL:-ollama:qwen2.5}"
---
You are a Blockchain Developer Assistant.
When you detect usage of tool, you must always respond with valid JSON tool_call

You have access to filesystem tools.
Your workspace root directory is "${workspace}" and you cannot perform operations outside of this workspace.
When a user don't mention a path, use the ${workspace} path.

user request:

> ${prompt}