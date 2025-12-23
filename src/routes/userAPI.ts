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
  sanitizeStudentID,
} from "../controllers/user.controller";
import {
  validateStudentAndMac,
  requireIpForGetConfig,
  antiCheatMiddleware,
} from "../middlewares/requestGuards";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) =>
      Promise.resolve(fn(req, res, next)).catch(next);

export const PROJECT_ROOT = path.join(__dirname, "..");
export const UPLOAD_DIR = path.join(PROJECT_ROOT, "upload");
export const ZIP_EXTENSION = ".zip";
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export function sanitizeStudentIDLocal(id: string): string {
  return sanitizeStudentID(id);
}

const router = Router();

/**
 * Ensure upload dir exists
 */
const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

/**
 * Multer storage
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir()
      .then(() => cb(null, UPLOAD_DIR))
      .catch((err) => cb(err, UPLOAD_DIR));
  },
  filename: (req, file, cb) => {
    const studentIDRaw = (req.body?.studentID ?? "").toString();
    const studentID = sanitizeStudentIDLocal(studentIDRaw);
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

// Route definitions with middleware
router.get("/status", asyncHandler(status));
router.get(
  "/get-config",
  requireIpForGetConfig,
  antiCheatMiddleware,
  asyncHandler(getConfig)
);
router.post(
  "/upload-program",
  upload.single("file"),
  validateStudentAndMac,
  antiCheatMiddleware,
  asyncHandler(uploadProgram)
);
router.post(
  "/post-result",
  validateStudentAndMac,
  antiCheatMiddleware,
  asyncHandler(postResult)
);
// router.post("/post-file", asyncHandler(postFile));
router.post(
  "/is-student-valid",
  validateStudentAndMac,
  antiCheatMiddleware,
  asyncHandler(isStudentValid)
);
router.post(
  "/user-action-logger",
  validateStudentAndMac,
  asyncHandler(userActionLogger)
);

export default router;