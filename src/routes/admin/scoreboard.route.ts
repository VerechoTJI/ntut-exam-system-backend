import { Router } from "express";
import * as scoreboardController from "../../controllers/admin/scoreboard.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin-Scoreboard
 *   description: Examination scoreboard
 */

/**
 * @swagger
 * /scoreboard:
 *   get:
 *     summary: Get all student scores
 *     tags: [Admin-Scoreboard]
 *     responses:
 *       200:
 *         description: Full scoreboard data
 */
// Get all student scores
router.get("/", scoreboardController.getAllScores);

/**
 * @swagger
 * /scoreboard/student:
 *   get:
 *     summary: Get student score by ID
 *     tags: [Admin-Scoreboard]
 *     parameters:
 *       - in: query
 *         name: studentID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student's score
 */
// Get student score by ID
router.get("/student", scoreboardController.getScoreByStudentId);

/**
 * @swagger
 * /scoreboard/broadcast:
 *   post:
 *     summary: Manually broadcast score update via socket
 *     tags: [Admin-Scoreboard]
 *     responses:
 *       200:
 *         description: Broadcast successful
 */
// Manually broadcast score update via socket
router.post("/broadcast", scoreboardController.broadcastScores);

export default router;
