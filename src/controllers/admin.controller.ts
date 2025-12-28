import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { InitService } from "../service/InitService";
import codeStorage from "../service/CodeStorage";
import { judgeAllCodeInStorage } from "../service/CodeJudger";
import systemSettingsService from "../service/SystemSettingsServices";
import scoreBoardService from "../service/ScoreBoardService";
import userLogService from "../service/UserLogService";
import violationLogService from "../service/ViolationLogService";
import os from "os";
import { USER_PORT } from "../index";

const UPLOAD_DIR = path.join(__dirname, "..", "upload");
const ZIP_EXTENSION = ".zip";

export const requireFields = (obj: any, fields: string[]) => {
  const missing = fields.filter(
    (f) => obj[f] === undefined || obj[f] === null || obj[f] === ""
  );
  return missing;
};

export const isSafeStudentId = (id: string) => /^[A-Za-z0-9_-]+$/.test(id);

const initService = new InitService();

export const heartbeat = async (_req: Request, res: Response) => {
  res.json({ success: true, data: { message: "User API is alive" } });
};

export const init = async (req: Request, res: Response) => {
  const missing = requireFields(req.body, ["config", "studentList"]);
  if (missing.length) {
    return res
      .status(400)
      .json({ success: false, message: `Missing: ${missing.join(", ")}` });
  }

  const ok = await initService.initialize(
    req.body.config,
    req.body.studentList
  );

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to create upload directory" });
  }

  if (!ok) {
    return res
      .status(500)
      .json({ success: false, message: "Initialization failed" });
  }

  res.json({ success: true, data: { message: "User API initialized" } });
};

export const resetDatabase = async (_req: Request, res: Response) => {
  await initService.resetDatabase(true);
  res.json({ success: true, data: { message: "Database reset" } });
};

export const isConfigured = async (_req: Request, res: Response) => {
  const config = await systemSettingsService.getConfig();
  res.json({ success: true, data: { isConfigured: !!config } });
};

export const getSubmittedStudents = async (_req: Request, res: Response) => {
  const result = await codeStorage.getAllZipFiles(UPLOAD_DIR);
  res.json({ success: true, data: { result } });
};

export const judgeCode = async (req: Request, res: Response) => {
  const { studentID } = req.body;
  if (
    !studentID ||
    typeof studentID !== "string" ||
    !isSafeStudentId(studentID)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid studentID" });
  }

  const safeStudentID = path.basename(studentID);
  const zipPath = path.join(UPLOAD_DIR, `${safeStudentID}${ZIP_EXTENSION}`);

  try {
    await fs.access(zipPath);
  } catch {
    return res
      .status(404)
      .json({ success: false, message: "Submission not found" });
  }

  const fileNames = await codeStorage.listFilesInZip(zipPath);
  const result = await judgeAllCodeInStorage(studentID, fileNames);
  res.json({ success: true, data: { result } });
};

export const getAllStudentScores = async (_req: Request, res: Response) => {
  const result = await scoreBoardService.getAllScores();
  res.json({ success: true, data: { result, success: true } });
};

export const updateAlertList = async (_req: Request, res: Response) => {
  // const alerts = await userLogService.checkSecurityAlerts();
  // const createdAlerts = await alertLogService.addFromAlerts(alerts);
  // await alertLogService.resetCooldown(true);
  res.json({ success: true, data: null });
};

export const getAlertLogs = async (_req: Request, res: Response) => {
  const result = await violationLogService.getAll();
  res.json({ success: true, data: { result } });
};

export const setAlertOkStatus = async (req: Request, res: Response) => {
  const missing = requireFields(req.body, ["id", "isOk"]);
  if (missing.length) {
    return res
      .status(400)
      .json({ success: false, message: `Missing: ${missing.join(", ")}` });
  }

  const { id, isOk } = req.body;
  const success = await violationLogService.setOkStatus(id, isOk);
  res.json({
    success,
    data: {
      message: success
        ? "Alert status updated"
        : "Failed to update alert status",
    },
  });
};

export const getAllLogs = async (_req: Request, res: Response) => {
  const result = await userLogService.getLastNLogs(70);
  res.json({ success: true, data: { result } });
};

export const updateConfigAvailability = async (req: Request, res: Response) => {
  const { available } = req.body;
  if (available === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Missing 'available' query parameter" });
  }

  const isSuccess = await systemSettingsService.updateConfigAvailability(
    Boolean(available)
  );
  if (!isSuccess) {
    return res.status(500).json({
      success: false,
      message: "Failed to update config availability",
    });
  }

  res.json({
    success: true,
    data: { message: "Config availability updated", currentStatus: available },
  });
};

export const getConfigAvailability = async (_req: Request, res: Response) => {
  const isAvailable = await systemSettingsService.getConfigAvailability();
  res.json({ success: true, data: { isAvailable } });
};


export const getStudentsCodes = async (req: Request, res: Response) => {
  const { studentID } = req.body;
  const result = await codeStorage.getAllZipFiles(UPLOAD_DIR);
  const isInSubmissions = result.includes(`${studentID}`);

  if (
    !studentID ||
    typeof studentID !== "string" ||
    !isSafeStudentId(studentID) || !isInSubmissions
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid studentID" });
  }

  const safeStudentID = path.basename(studentID);
  const zipDir = UPLOAD_DIR;

  try {
    const codes = await codeStorage.getStudentsCodes(safeStudentID, zipDir);
    console.log("Retrieved codes:", codes);
    res.json({ success: true, data: { ...codes } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve student codes" });
  }
};


export const getHostUserUrl = async (_req: Request, res: Response) => {
  const networkInterfaces = os.networkInterfaces();
  // 遍歷所有網絡接口並找出內網 IP 地址
  function getLocalIp() {
    for (const interfaceName in networkInterfaces) {
      for (const interfaceInfo of networkInterfaces[interfaceName]) {
        // 檢查是否是 IPv4 地址並且是內網地址
        if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
          return interfaceInfo.address;
        }
      }
    }
    return null; // 如果沒有找到內網 IP
  }
  const localIp = getLocalIp();
  if (!localIp) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to retrieve local IP address", data: { url: null } });
  }
  const url = `http://${localIp}:${USER_PORT}`;
  res.json({ success: true, data: { url } });
};