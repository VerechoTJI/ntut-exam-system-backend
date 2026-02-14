import { Router } from "express";
import * as anticheatController from "../../controllers/admin/anticheat.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin-Anticheat
 *   description: Anticheat monitoring and logs
 */

/**
 * @swagger
 * /anticheat/logs:
 *   get:
 *     summary: Get all alert logs
 *     tags: [Admin-Anticheat]
 *     responses:
 *       200:
 *         description: List of alert logs
 */
// Get all alert logs
router.get("/logs", anticheatController.getAlertLogs);

/**
 * @swagger
 * /anticheat/logs/{studentID}:
 *   get:
 *     summary: Get alert logs by student ID
 *     tags: [Admin-Anticheat]
 *     parameters:
 *       - in: path
 *         name: studentID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of alert logs for the student
 */
// Get alert logs by student ID
router.get("/logs/:studentID", anticheatController.getAlertLogsByStudentId);

/**
 * @swagger
 * /anticheat/status:
 *   put:
 *     summary: Set alert OK status (dismiss alert)
 *     tags: [Admin-Anticheat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert status updated
 */
// Set alert OK status
router.put("/status", anticheatController.setAlertOkStatus);

export default router;
