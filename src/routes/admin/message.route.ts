import { Router } from "express";
import * as messageController from "../../controllers/admin/message.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin-Message
 *   description: Messaging system
 */

/**
 * @swagger
 * /message:
 *   post:
 *     summary: Send message to user
 *     tags: [Admin-Message]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               to:
 *                 type: string
 *                 description: Student ID
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post("/", messageController.sendMessageToUser);

/**
 * @swagger
 * /message:
 *   get:
 *     summary: Get all messages
 *     tags: [Admin-Message]
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get("/", messageController.getAllMessages);

export default router;
