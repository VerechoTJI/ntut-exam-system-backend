import { Request, Response, NextFunction } from "express";
import type { File as MulterFile } from "multer";
import fs from "fs/promises";
import path from "path";
import systemSettingsService from "../service/SystemSettingsServices";
import scoreBoardService from "../service/ScoreBoardService";
import userLogService from "../service/UserLogService";
import socketService from "../socket/SocketService";
import alertLogService from "../service/AlertLogService";

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

// GET /status
export const status = async (_req: Request, res: Response) => {
  res.json({ success: true });
};

// GET /get-config
export const getConfig = async (_req: Request, res: Response) => {
  const config = await systemSettingsService.getConfig();
  if (!config) {
    return res
      .status(500)
      .json({ success: false, message: "Config not found in settings" });
  }
  res.json(config);
};

// POST /upload-program (multer 已處理檔案)
export const uploadProgram = async (req: Request, res: Response) => {
  const file = (req as any).file as MulterFile | undefined;
  const studentIDRaw = req.body?.studentID ?? "";
  const studentID = sanitizeStudentID(studentIDRaw);

  if (!file || !studentID) {
    return res
      .status(400)
      .json({ success: false, message: "Missing file or studentID" });
  }

  // 確認副檔名
  const ext = path.extname(file.filename).toLowerCase();
  if (ext && ext !== ZIP_EXTENSION) {
    // 若有需要可在這裡回 400；目前僅警告
    console.warn(`Non-zip upload attempted: ${file.originalname}`);
  }

  res.json({ success: true, filename: file.filename, path: file.path });
};

// POST /post-result
export const postResult = async (req: Request, res: Response) => {
  const studentID = req.body?.studentInformation?.id;
  const results = req.body?.testResult || {};

  if (!studentID) {
    return res
      .status(400)
      .json({ success: false, message: "Missing studentID" });
  }

  let correctCount = 0;
  for (const group in results) {
    const c = results[group]?.correctCount ?? 0;
    correctCount += c;
  }

  await scoreBoardService.updateStudentScore({
    student_ID: studentID,
    score: results,
    passed_amount: correctCount,
  });

  const scoreboard = await scoreBoardService.getAllScores();
  socketService.triggerScoreUpdateEvent(scoreboard);

  res.json({ success: true, message: "Results received successfully" });
};

// POST /post-file
export const postFile = async (req: Request, res: Response) => {
  res.json({ message: "File data received successfully" });
};

// POST /is-student-valid
export const isStudentValid = async (req: Request, res: Response) => {
  const studentID = req.body?.studentID;
  const studentInfo = await systemSettingsService.getStudentInfo(studentID);

  if (studentInfo) {
    return res.json({
      isValid: true,
      info: { id: studentInfo.student_ID, name: studentInfo.name },
    });
  }
  res.json({ isValid: false });
};

// POST /user-action-logger
export const userActionLogger = async (req: Request, res: Response) => {
  const userIP = req.ip || req.socket.remoteAddress || "unknown";
  const studentID = req.body?.studentID ?? "unknown";

  console.log(
    `User ${studentID} from IP: ${userIP} performed action: ${req.body?.actionType}`,
    req.body?.details
  );

  await userLogService.createLog({
    student_ID: studentID,
    ip_address: userIP,
    action_type: req.body?.level || "unknown",
    details: req.body?.details?.[0] || "",
  });

  await alertLogService.updateAndCheckAlerts();
  res.json({ success: true, message: "Action logged successfully" });
};
