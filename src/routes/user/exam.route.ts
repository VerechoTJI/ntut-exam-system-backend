import { Router, Request, Response, NextFunction } from "express";
const multer = require("multer");
import path from "path";
import fs from "fs/promises";
import * as examController from "../../controllers/user/exam.controller";
import { verifyUserAccessTokenMiddleware } from "../../middlewares/auth-user-token";
import { sanitizeStudentID } from "../../controllers/user.controller";

const router = Router();

// Upload directory configuration
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const UPLOAD_DIR = path.join(PROJECT_ROOT, "upload");
const ZIP_EXTENSION = ".zip";
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Ensure upload dir exists
 */
const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    ensureUploadDir()
      .then(() => cb(null, UPLOAD_DIR))
      .catch((err) => cb(err, UPLOAD_DIR));
  },
  filename: (req: any, file: any, cb: any) => {
    const studentIDRaw = (req.body?.studentID ?? "").toString();
    const studentID = sanitizeStudentID(studentIDRaw);
    const targetName = `${studentID}${ZIP_EXTENSION}`;

    if (!studentID) {
      return cb(
        new Error("Missing studentID in form-data before file field."),
        "",
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (ext && ext !== ZIP_EXTENSION) {
      console.warn(
        `Non-zip upload attempted: ${file.originalname}. Forcing name ${targetName}.`,
      );
    }

    cb(null, targetName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
});

// Get exam config (before exam starts, no token required)
router.get("/config", examController.getConfig);

// Get exam config with token (after exam starts, encrypted)
router.post(
  "/config-secure",
  verifyUserAccessTokenMiddleware,
  examController.getConfigSecure,
);

// Upload local test results (requires token)
router.post(
  "/result",
  verifyUserAccessTokenMiddleware,
  examController.uploadResult,
);

// Upload program file (requires token)
router.post(
  "/upload",
  upload.single("file"),
  verifyUserAccessTokenMiddleware,
  examController.uploadProgram,
);

export default router;
