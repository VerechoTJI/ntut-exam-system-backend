import { Router, Request, Response, NextFunction } from "express";
import {
  heartbeat,
  init,
  resetDatabase,
  isConfigured,
  getSubmittedStudents,
  judgeCode,
  getAllStudentScores,
  updateAlertList,
  getAlertLogs,
  setAlertOkStatus,
  getAllLogs,
} from "../controllers/admin.controller";

const router = Router();

// 通用 async handler
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get("/heartbeat", asyncHandler(heartbeat));
router.post("/init", asyncHandler(init));
router.get("/reset-database", asyncHandler(resetDatabase));
router.get("/is-configured", asyncHandler(isConfigured));
router.get("/get-submitted-students", asyncHandler(getSubmittedStudents));
router.post("/judge-code", asyncHandler(judgeCode));
router.post("/all-student-scores", asyncHandler(getAllStudentScores));
router.get("/update-alert-list", asyncHandler(updateAlertList));
router.get("/get-alert-logs", asyncHandler(getAlertLogs));
router.post("/set-alert-ok-status", asyncHandler(setAlertOkStatus));
router.get("/get-all-logs", asyncHandler(getAllLogs));

export default router;
