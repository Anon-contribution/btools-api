// TODO use file-type package to get precise ext/mime
import unzipper from "unzipper";

/**
 * 
 * @param {MulterFile} multerFile
 * @param {*} destDir destination directory 
 */
export const extractUploadedFile = async (multerFile, destDir) => {

    const { originalname, path: tempPath } = multerFile;
    const ext = path.extname(originalname);

    if (![".zip", ".tar", ".tar.gz"].includes(ext)) {
        throw new Error("File must be zip or tar archive");
    }

    try {
        const archivePath = path.join(destDir, originalname);
        await fs.rename(tempPath, archivePath);
    
        // extract the archive
        if (ext === '.tar') {
            await x({
                file: archivePath,
                cwd: workspace
            });
        } else if (ext === '.zip') {
            await fs.createReadStream(archivePath)
                .pipe(unzipper.Extract({ path: workspace }))
                .promise();
        }

        await fs.unlink(archivePath)   
    } catch (error) {
        throw new Error("Error during file extraction")
    }
}

export const clearWorkspace = async () => {
    // remove all files from workspace
}