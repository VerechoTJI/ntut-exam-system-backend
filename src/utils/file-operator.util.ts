import path from "path";

const codePath = "upload"
export function getZipFilePath(studentID: string): string {
    const rawPath = path.join(__dirname, `../${codePath}/${studentID}.zip`);
    return path.posix.normalize(rawPath.replace(/\\/g, "/"));
}
