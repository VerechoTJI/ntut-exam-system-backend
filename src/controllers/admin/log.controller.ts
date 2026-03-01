import userLogService from "../../service/user-log.service";
import { Request, Response, NextFunction } from "express";
import { sanitizeStudentID } from "../../utils/guard.util";

export const getLogsByIp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { ip } = req.query;
  if (typeof ip !== "string") {
    return res.status(400).json({ error: "Invalid IP parameter" });
  }
  try {
    const logs = await userLogService.getLogsByIp(ip);
    return res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const getLogsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { studentId } = req.query;
  if (typeof studentId !== "string") {
    return res.status(400).json({ error: "Invalid studentId parameter" });
  }
  const sanitizedStudentId = sanitizeStudentID(studentId);
  try {
    const logs = await userLogService.getLogsByStudent(sanitizedStudentId);
    return res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const getAllLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { limit } = req.query;
    if (limit && typeof limit === "string") {
      const n = parseInt(limit, 10);
      if (!isNaN(n) && n > 0) {
        const logs = await userLogService.getLastNLogs(n);
        return res.json(logs);
      }
    }
    const n = 100; // default limit
    const logs = await userLogService.getLastNLogs(n);
    return res.json(logs);
  } catch (error) {
    console.error("❌ Get all logs error:", error);
    return res.status(500).json({ error: "Failed to get all logs" });
  }
};
