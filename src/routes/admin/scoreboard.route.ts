import { Router } from "express";
import * as scoreboardController from "../../controllers/admin/scoreboard.controller";

const router = Router();

// Get all student scores
router.get("/", scoreboardController.getAllScores);

// Get student score by ID
router.get("/:studentID", scoreboardController.getScoreByStudentId);

// Manually broadcast score update via socket
router.post("/broadcast", scoreboardController.broadcastScores);

export default router;
