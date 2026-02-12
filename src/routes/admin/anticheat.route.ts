import { Router } from "express";
import * as anticheatController from "../../controllers/admin/anticheat.controller";

const router = Router();

// Get all alert logs
router.get("/logs", anticheatController.getAlertLogs);

// Get alert logs by student ID
router.get("/logs/:studentID", anticheatController.getAlertLogsByStudentId);

// Set alert OK status
router.put("/status", anticheatController.setAlertOkStatus);

export default router;
