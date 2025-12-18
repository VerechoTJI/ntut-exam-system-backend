import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import {
  status,
  getConfig,
  uploadProgram,
  postResult,
  postFile,
  isStudentValid,
  userActionLogger,
} from "../controllers/user.controller";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const PROJECT_ROOT = path.join(__dirname, "..");
export const UPLOAD_DIR = path.join(PROJECT_ROOT, "upload");
export const ZIP_EXTENSION = ".zip";
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export function sanitizeStudentID(id: string): string {
  return (id || "")
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

export function requireFields(obj: any, fields: string[]) {
  const missing = fields.filter(
    (f) => obj[f] === undefined || obj[f] === null || obj[f] === ""
  );
  return missing;
}

const router = Router();

/**
 * 確保上傳目錄存在（非同步且非阻塞）
 */
const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

/**
 * Multer 設定：使用 diskStorage，但確保 mkdir 採用 fs/promises
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir()
      .then(() => cb(null, UPLOAD_DIR))
      .catch((err) => cb(err, UPLOAD_DIR));
  },
  filename: (req, file, cb) => {
    const studentIDRaw = (req.body?.studentID ?? "").toString();
    const studentID = sanitizeStudentID(studentIDRaw);
    const targetName = `${studentID}${ZIP_EXTENSION}`;

    if (!studentID) {
      return cb(
        new Error("Missing studentID in form-data before file field."),
        ""
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (ext && ext !== ZIP_EXTENSION) {
      console.warn(
        `Non-zip upload attempted: ${file.originalname}. Forcing name ${targetName}.`
      );
    }

    cb(null, targetName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
});

// 路由定義
router.get("/status", asyncHandler(status));
router.get("/get-config", asyncHandler(getConfig));
router.post(
  "/upload-program",
  upload.single("file"),
  asyncHandler(uploadProgram)
);
router.post("/post-result", asyncHandler(postResult));
router.post("/post-file", asyncHandler(postFile));
router.post("/is-student-valid", asyncHandler(isStudentValid));
router.post("/user-action-logger", asyncHandler(userActionLogger));

export default router;
