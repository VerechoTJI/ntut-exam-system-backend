import { Router } from "express";
import * as logController from "../../controllers/user/log.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User-Log
 *   description: Client action logging
 */

/**
 * @swagger
 * /log/action:
 *   post:
 *     summary: Log user action
 *     tags: [User-Log]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *               studentID:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action logged
 */
// Log user action (no token verification required)
router.post("/action", logController.logAction);

export default router;
