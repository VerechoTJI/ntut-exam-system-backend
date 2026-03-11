import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs/promises";
import codeStorage from "../../service/code-storage";
import { judgeAllSubmittedPuzzles } from "../../service/code-judger.service";
import scoreBoardService from "../../service/scoreboard.service";
import systemSettingsService from "../../service/sys-settings.service";
import { ErrorHandler } from "../../middlewares/error-handler";
import { overwriteScoreBoardWithPistonResults } from "../../utils/judger.util";
import { getDefaultScoreboard } from "../../utils/init-db.util";
import { SocketService } from "../../socket/SocketService";

const UPLOAD_DIR = path.join(__dirname, "..", "..", "upload");
const ZIP_EXTENSION = ".zip";

const isSafeStudentId = (id: string) => /^[A-Za-z0-9_-]+$/.test(id);

/**
 * Judge student code
 * POST /admin/code/judge
 * Body: { studentID: string }
 */
export const judgeCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentID } = req.body;

    if (
      !studentID ||
      typeof studentID !== "string" ||
      !isSafeStudentId(studentID)
    ) {
      throw new ErrorHandler(400, "Invalid studentID");
    }

    const safeStudentID = path.basename(studentID);
    const zipPath = path.join(UPLOAD_DIR, `${safeStudentID}${ZIP_EXTENSION}`);

    try {
      await fs.access(zipPath);
    } catch {
      throw new ErrorHandler(404, "Submission not found");
    }

    // Get all files in the zip
    const fileNames = await codeStorage.listFilesInZip(zipPath);

    // Judge all submitted puzzles
    const judgeResults = await judgeAllSubmittedPuzzles(studentID, fileNames);

    // Build default scoreboard (all problems as WA) then overwrite with piston results
    const config = await systemSettingsService.getConfig();
    if (!config) throw new ErrorHandler(500, "No system config found");
    const defaultScoreboard = getDefaultScoreboard(config.puzzles);
    const pistonScoreboard = overwriteScoreBoardWithPistonResults(judgeResults);
    const updatedScoreboard = { ...defaultScoreboard, ...pistonScoreboard };

    // Update student score in scoreboard
    await scoreBoardService.updateStudentScore(updatedScoreboard, studentID);

    // Trigger socket event to notify all clients about score update
    const allScores = await scoreBoardService.getAllScores();
    SocketService.triggerScoreUpdateEvent(allScores);

    res.status(200).json({
      success: true,
      message: "Code judged successfully",
      data: { result: updatedScoreboard },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all submitted students
 * GET /admin/code/submitted-students
 */
export const getSubmittedStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await codeStorage.getAllZipFiles(UPLOAD_DIR);
    res.status(200).json({
      success: true,
      data: { students: result },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student code
 * GET /admin/code/:studentID
 * Or POST /admin/code with body: { studentID: string }
 */
export const getStudentCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentID = req.params.studentID || req.body.studentID;

    if (
      !studentID ||
      typeof studentID !== "string" ||
      !isSafeStudentId(studentID)
    ) {
      throw new ErrorHandler(400, "Invalid studentID");
    }

    // Check if student has submitted
    const submittedStudents = await codeStorage.getAllZipFiles(UPLOAD_DIR);
    const isSubmitted = submittedStudents.includes(studentID);

    if (!isSubmitted) {
      throw new ErrorHandler(404, "Student has not submitted any code");
    }

    const safeStudentID = path.basename(studentID);
    const codes = await codeStorage.getStudentsCodes(safeStudentID, UPLOAD_DIR);

    if (!codes || (Array.isArray(codes) && codes.length === 0)) {
      throw new ErrorHandler(500, "Failed to retrieve student codes");
    }

    res.status(200).json({
      success: true,
      data: codes,
    });
  } catch (error) {
    next(error);
  }
};
