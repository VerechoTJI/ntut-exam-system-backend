import { Request, Response, NextFunction } from "express";
import scoreBoardService from "../../service/scoreboard.service";
import { ErrorHandler } from "../../middlewares/error-handler";
import { SocketService } from "../../socket/SocketService";

/**
 * Get all student scores
 * GET /admin/scoreboard
 */
export const getAllScores = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await scoreBoardService.getAllScores();
    res.status(200).json({
      success: true,
      data: { scores: result },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student score by ID
 * GET /admin/scoreboard/:studentID
 */
export const getScoreByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentID } = req.body;
    console.log("Received request for studentID:", studentID);

    if (!studentID) {
      throw new ErrorHandler(400, "Missing required parameter: studentID");
    }

    const result = await scoreBoardService.getScoreByStudentId(studentID);

    if (!result) {
      throw new ErrorHandler(404, "Student score not found");
    }

    res.status(200).json({
      success: true,
      data: { score: result },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger score update event via socket
 * POST /admin/scoreboard/broadcast
 * This can be used to manually trigger a score update broadcast to all connected clients
 */
export const broadcastScores = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const allScores = await scoreBoardService.getAllScores();
    SocketService.triggerScoreUpdateEvent(allScores);

    res.status(200).json({
      success: true,
      message: "Score update broadcast sent successfully",
      data: { scores: allScores },
    });
  } catch (error) {
    next(error);
  }
};
