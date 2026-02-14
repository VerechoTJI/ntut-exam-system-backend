import { Router } from "express";
import * as configController from "../../controllers/admin/config.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin-Config
 *   description: Exam configuration management
 */

/**
 * @swagger
 * /config:
 *   post:
 *     summary: Create exam configuration
 *     tags: [Admin-Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamConfig'
 *     responses:
 *       201:
 *         description: Exam configuration created successfully
 */
// Create exam configuration
router.post("/", configController.createConfig);

/**
 * @swagger
 * /config:
 *   put:
 *     summary: Update exam configuration
 *     tags: [Admin-Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamConfig'
 *     responses:
 *       200:
 *         description: Exam configuration updated successfully
 */
// Update exam configuration
router.put("/", configController.updateConfig);

/**
 * @swagger
 * /config:
 *   get:
 *     summary: Get current exam configuration
 *     tags: [Admin-Config]
 *     responses:
 *       200:
 *         description: Current configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExamConfig'
 */
// Get exam configuration
router.get("/", configController.getConfig);

/**
 * @swagger
 * /config/testcase:
 *   put:
 *     summary: Update test case (only allowed after exam has started)
 *     tags: [Admin-Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testTitle:
 *                 type: string
 *               puzzles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     subtasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           visible:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/TestCase'
 *                           hidden:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/TestCase'
 *     responses:
 *       200:
 *         description: Test case updated successfully
 */
// Update test case (only allowed after exam has started)
router.put("/testcase", configController.updateTestCase);

export default router;
