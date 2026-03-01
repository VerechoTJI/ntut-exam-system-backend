import { Request, Response, NextFunction } from "express";
import systemSettingsService from "../../service/sys-settings.service";
import scoreBoardService from "../../service/scoreboard.service";
import userLogService from "../../service/user-log.service";
import { SocketService } from "../../socket/SocketService";
import { ErrorHandler } from "../../middlewares/error-handler";
import { encryptDataWithUserAES } from "../../service/user-crypto.service";
import { updateClientJudgeResultToScoreBoardFormat } from "../../utils/judger.util";
import { sanitizeStudentID } from "../../utils/guard.util";
import antiCheatService from "../../service/anticheat.service";

/**
 * Get exam config (before exam starts)
 * GET /user/exam/config
 */
export const getConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const examStatus = await systemSettingsService.getExamStatus();

    if (examStatus) {
      throw new ErrorHandler(
        403,
        "Exam has already started. Config is no longer available.",
      );
    }

    // const configAvailability =
    //   await systemSettingsService.getConfigAvailability();

    // if (!configAvailability) {
    //   throw new ErrorHandler(403, "Config is not available at the moment");
    // }

    const config = await systemSettingsService.getConfig();

    if (!config) {
      throw new ErrorHandler(404, "Config not found");
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get exam config with token (after exam starts, encrypted with user's AES key)
 * POST /user/exam/config-secure
 * Headers: x-user-token
 * Body: { studentID: string }
 */
export const getConfigSecure = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentID } = req.body;

    if (!studentID) {
      throw new ErrorHandler(400, "Missing required field: studentID");
    }

    const config = await systemSettingsService.getConfig();

    if (!config) {
      throw new ErrorHandler(404, "Config not found");
    }

    // Encrypt config with user's AES key
    const configStr = JSON.stringify(config);
    const encryptedConfig = await encryptDataWithUserAES(configStr, studentID);

    antiCheatService.logWithAntiCheat({
      student_ID: studentID,
      ip_address: req.ip || req.socket.remoteAddress || "unknown",
      mac_address: req.body?.macAddress ?? "",
      action_type: "get_encrypted_config",
      details: "Requested encrypted exam config",
    });

    res.status(200).json({
      success: true,
      data: {
        encryptedConfig,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload local test results
 * POST /user/exam/result
 * Headers: x-user-token
 * Body: { studentID: string, testResult: ClientResultFormat }
 */
export const uploadResult = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentID, testResult } = req.body;

    console.dir(req.body, { depth: null });
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const mac = req.body?.macAddress ?? "";

    if (!studentID) {
      throw new ErrorHandler(400, "Missing required field: studentID");
    }

    if (!testResult) {
      throw new ErrorHandler(400, "Missing required field: testResult");
    }

    // Get current student scoreboard
    const currentScore = await scoreBoardService.getScoreByStudentId(studentID);
    const originalScoreboard = (currentScore?.puzzle_results || {}) as any;

    // Convert client result to scoreboard format
    const updatedScoreboard = updateClientJudgeResultToScoreBoardFormat(
      testResult,
      originalScoreboard,
    );

    // Update student score
    await scoreBoardService.updateStudentScore(updatedScoreboard, studentID);

    // Trigger socket event to notify all clients
    const allScores = await scoreBoardService.getAllScores();
    SocketService.triggerScoreUpdateEvent(allScores);

    // Log the action
    await antiCheatService.logWithAntiCheat({
      student_ID: studentID,
      ip_address: ip,
      mac_address: mac,
      action_type: "upload_test_result",
      details: `Uploaded test result: ${JSON.stringify(testResult)}`,
    });

    res.status(200).json({
      success: true,
      message: "Test results uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload program file
 * POST /user/exam/upload
 * Headers: x-user-token
 * Body: multipart/form-data with file and studentID
 */
export const uploadProgram = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = (req as any).file as any;
    const studentIDRaw = req.body?.studentID ?? "";
    const studentID = sanitizeStudentID(studentIDRaw);
    const mac = req.body?.macAddress ?? "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    if (!file) {
      throw new ErrorHandler(400, "Missing file in upload");
    }

    if (!studentID) {
      throw new ErrorHandler(400, "Missing studentID");
    }

    // Log the upload action
    await userLogService.createLog({
      student_ID: studentID,
      ip_address: ip,
      mac_address: mac,
      action_type: "upload_program",
      details: `Uploaded file: ${file.originalname} as ${file.filename}`,
    });

    res.status(200).json({
      success: true,
      message: "Program uploaded successfully",
      data: {
        filename: file.filename,
        path: file.path,
      },
    });
  } catch (error) {
    next(error);
  }
};
