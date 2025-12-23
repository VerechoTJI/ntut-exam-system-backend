import { Request, Response } from "express";
import type { File as MulterFile } from "multer";
import fs from "fs/promises";
import path from "path";
import systemSettingsService from "../service/SystemSettingsServices";
import scoreBoardService from "../service/ScoreBoardService";
import userLogService from "../service/UserLogService";
import socketService from "../socket/SocketService";
import studentNetworkService from "../service/StudentNetwork";
import { antiCheatMiddleware } from "middlewares/requestGuards";
import antiCheatService from "../service/AntiCheatService";

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

export const status = async (_req: Request, res: Response) => {
  res.json({ success: true });
};

export const getConfig = async (_req: Request, res: Response) => {
  const config = await systemSettingsService.getConfig();
  if (!config) {
    return res
      .status(500)
      .json({ success: false, message: "Config not found in settings" });
  }
  res.json(config);
};

export const uploadProgram = async (req: Request, res: Response) => {
  const file = (req as any).file as MulterFile | undefined;
  const studentIDRaw = req.body?.studentID ?? "";
  const studentID = sanitizeStudentID(studentIDRaw);
  const mac = req.body?.macAddress ?? "";
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  if (!file || !studentID) {
    return res
      .status(400)
      .json({ success: false, message: "Missing file or studentID" });
  }
  const ext = path.extname(file.filename).toLowerCase();
  if (ext && ext !== ZIP_EXTENSION) {
    console.warn(`Non-zip upload attempted: ${file.originalname}`);
  }

  userLogService
    .createLog({
      student_ID: studentID,
      ip_address: ip,
      mac_address: mac,
      action_type: "upload",
      details: `Uploaded file: ${file.originalname} as ${file.filename}`,
    })
    .catch((err) => {
      console.error("Failed to log upload action:", err);
    });

  res.json({ success: true, filename: file.filename, path: file.path });
};

export const postResult = async (req: Request, res: Response) => {
  const studentID = req.body?.studentInformation?.id;
  const results = req.body?.testResult || {};
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const mac = req.body?.macAddress ?? "";

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

  await userLogService.createLog({
    student_ID: studentID,
    ip_address: ip,
    mac_address: mac,
    action_type: "submit_result",
    details: `Submitted results with ${correctCount} correct answers.`,
  });

  res.json({ success: true, message: "Results received successfully" });
};

export const postFile = async (_req: Request, res: Response) => {
  res.json({ message: "File data received successfully" });
};

export const isStudentValid = async (req: Request, res: Response) => {
  const studentID = req.body?.studentID;
  const mac = req.body?.macAddress ?? "";
  const studentInfo = await systemSettingsService.getStudentInfo(studentID);
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  await userLogService.createLog({
    student_ID: studentID || "unknown",
    ip_address: ip,
    mac_address: mac,
    action_type: "verify_student | login",
    details: `Verified student ID: ${studentID}`,
  });

  const userPSK = await studentNetworkService.getKey(studentID);

  if (studentInfo) {
    return res.json({
      isValid: true,
      info: {
        id: studentInfo.student_ID,
        name: studentInfo.name,
        psk: userPSK ? userPSK : null,
      },
    });
  }
  res.json({ isValid: false });
};

export const userActionLogger = async (req: Request, res: Response) => {
  const userIP = req.ip || req.socket.remoteAddress || "unknown";
  const studentID = req.body?.studentID ?? "unknown";
  const mac = req.body?.macAddress ?? "";

  console.log(
    `User ${studentID} from IP: ${userIP} performed action: ${req.body?.actionType}`,
    req.body?.details
  );

  await antiCheatService.logWithAntiCheat({
    student_ID: studentID,
    ip_address: userIP,
    mac_address: mac,
    action_type: req.body?.level || "unknown",
    details: req.body?.details?.[0] || "",
  });
  res.json({ success: true, message: "Action logged successfully" });
};