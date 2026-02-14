import { Router, Request, Response, NextFunction } from "express";
const multer = require("multer");
import path from "path";
import fs from "fs/promises";
import * as examController from "../../controllers/user/exam.controller";
import { verifyUserAccessTokenMiddleware } from "../../middlewares/auth-user-token";
import { sanitizeStudentID } from "../../utils/guard.util";

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

/**
 * @swagger
 * tags:
 *   name: User-Exam
 *   description: Exam execution and file uploads
 */

/**
 * @swagger
 * /exam/config:
 *   get:
 *     summary: Get exam config (before exam starts)
 *     tags: [User-Exam]
 *     responses:
 *       200:
 *         description: Public exam config
 */
// Get exam config (before exam starts, no token required)
router.get("/config", examController.getConfig);

/**
 * @swagger
 * /exam/config-secure:
 *   post:
 *     summary: Get exam config with token (after exam starts)
 *     tags: [User-Exam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Encrypted exam config
 */
// Get exam config with token (after exam starts, encrypted)
router.post(
  "/config-secure",
  verifyUserAccessTokenMiddleware,
  examController.getConfigSecure,
);

/**
 * @swagger
 * /exam/result:
 *   post:
 *     summary: Upload local test results
 *     tags: [User-Exam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               result:
 *                 type: object
 *     responses:
 *       200:
 *         description: Result uploaded
 */
// Upload local test results (requires token)
router.post(
  "/result",
  verifyUserAccessTokenMiddleware,
  examController.uploadResult,
);

/**
 * @swagger
 * /exam/upload:
 *   post:
 *     summary: Upload program file
 *     tags: [User-Exam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               studentID:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
// Upload program file (requires token)
router.post(
  "/upload",
  upload.single("file"),
  verifyUserAccessTokenMiddleware,
  examController.uploadProgram,
);

export default router;
