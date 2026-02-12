import { Request, Response, NextFunction } from "express";
import antiCheatService from "../../service/anticheat.service";
import { ErrorHandler } from "../../middlewares/error-handler";

/**
 * Log user action
 * POST /user/log/action
 * Body: { studentID: string, actionType: string, details: string, level: string, macAddress: string }
 * No token verification required
 */
export const logAction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userIP = req.ip || req.socket.remoteAddress || "unknown";
    const studentID = req.body?.studentID ?? "unknown";
    const mac = req.body?.macAddress ?? "";
    const actionType = req.body?.level || req.body?.actionType || "unknown";
    const details = req.body?.details?.[0] || req.body?.details || "";

    // Log with anti-cheat service
    await antiCheatService.logWithAntiCheat({
      student_ID: studentID,
      ip_address: userIP,
      mac_address: mac,
      action_type: actionType,
      details: typeof details === "string" ? details : JSON.stringify(details),
    });

    res.status(200).json({
      success: true,
      message: "Action logged successfully",
    });
  } catch (error) {
    next(error);
  }
};
