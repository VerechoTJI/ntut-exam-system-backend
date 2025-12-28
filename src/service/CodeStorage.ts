import path from "path";
import fs from "fs";
import unzipper from "unzipper";

class CodeStorage {
  async getAllZipFiles(dir: string): Promise<string[]> {
    let zipFiles: string[] = [];

    function traverse(currentPath: string) {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          traverse(fullPath); // 遞迴子目錄
        } else if (path.extname(file).toLowerCase() === ".zip") {
          const fileNameWithoutExt = path.basename(file, ".zip");
          zipFiles.push(fileNameWithoutExt); // 存完整路徑
        }
      }
    }

    traverse(dir);
    return zipFiles;
  }

  /**
   * 取得 zip 檔內所有檔案的 entry 路徑（不包含目錄）
   * 回傳格式範例: ['1.py', 'src/2.py', 'docs/readme.md']
   * @param zipFilePath zip 檔案的路徑
   */
  async listFilesInZip(zipFilePath: string): Promise<string[]> {
    // 檢查檔案是否存在且可讀
    try {
      await fs.promises.access(zipFilePath, fs.constants.R_OK);
    } catch (err) {
      throw new Error(`Zip file not accessible: ${zipFilePath}`);
    }

    try {
      // 使用 unzipper.Open.file 直接取得目錄資訊
      const directory = await unzipper.Open.file(zipFilePath);
      // 過濾掉資料夾（entry.path 若為資料夾通常會以 '/' 結尾）
      const filePaths = directory.files
        .filter((f) => !f.path.endsWith("/"))
        .map((f) => f.path);
      return filePaths;
    } catch (err) {
      throw new Error(
        `Failed to read zip file: ${(err && (err as Error).message) || String(err)
        }`
      );
    }
  }

  async unzipGetFileAsString(
    zipFilePath: string,
    targetPath: string,
    encoding: BufferEncoding = "utf8"
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let found = false;

      fs.createReadStream(zipFilePath)
        .on("error", reject)
        .pipe(unzipper.Parse())
        .on("entry", async (entry: any) => {
          const { path: entryPath, type } = entry;
          if (type === "File" && entryPath === targetPath) {
            found = true;
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of entry) {
                chunks.push(chunk);
              }
              const buf = Buffer.concat(chunks);
              resolve(buf.toString(encoding));
            } catch (e) {
              entry.autodrain();
              reject(e);
            }
          } else {
            // 非目標檔案或目錄，直接排水避免佔記憶體
            entry.autodrain();
          }
        })
        .on("close", () => {
          if (!found)
            reject(new Error(`Target file not found in zip: ${targetPath}`));
        })
        .on("error", reject);
    });
  }

  async getStudentsCodes(
    studentID: string,
    zipDir: string
  ): Promise<{ codeList: string[]; codeOBJ: Record<string, string> } | []> {
    const zipFilePath = path.join(zipDir, `${studentID}.zip`);
    try {
      let codeOBJ = {};
      const fileList = await this.listFilesInZip(zipFilePath);
      for (const filePath of fileList) {
        const code = await this.unzipGetFileAsString(
          zipFilePath,
          filePath,
          "utf8"
        );
        codeOBJ[filePath] = code;
      }
      return {
        codeList: fileList,
        codeOBJ: codeOBJ
      }
    } catch (error) {
      console.error(
        `Error retrieving code files for student ${studentID}:`,
        error
      );
      return [];
    }
  }
}
const codeStorage = new CodeStorage();
export default codeStorage;
