import { Router } from "express";
import * as messageController from "../../controllers/user/message.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User-Message
 *   description: Messages for students
 */

/**
 * @swagger
 * /message/all:
 *   get:
 *     summary: Get messages after a specific ID
 *     tags: [User-Message]
 *     parameters:
 *       - in: query
 *         name: afterId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get("/all", messageController.getMessagesAfterId);

/**
 * @swagger
 * /message/config-version:
 *   get:
 *     summary: Get config version
 *     tags: [User-Message]
 *     responses:
 *       200:
 *         description: Config version
 */
router.get("/config-version", messageController.getConfigVersion);

/**
 * @swagger
 * /message/message-version:
 *   get:
 *     summary: Get message version
 *     tags: [User-Message]
 *     responses:
 *       200:
 *         description: Message version
 */
router.get("/message-version", messageController.getMessageVersion);

export default router;
