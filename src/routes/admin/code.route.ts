import { Router } from "express";
import * as codeController from "../../controllers/admin/code.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin-Code
 *   description: Code judgment and retrieval
 */

/**
 * @swagger
 * /code/judge:
 *   post:
 *     summary: Judge student code
 *     tags: [Admin-Code]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentID:
 *                 type: string
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *               puzzleIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Judgment result
 */
// Judge student code - requires studentID in body
router.post("/judge", codeController.judgeCode);

/**
 * @swagger
 * /code/submitted-students:
 *   get:
 *     summary: Get all submitted students
 *     tags: [Admin-Code]
 *     responses:
 *       200:
 *         description: List of students who submitted code
 */
// Get all submitted students
router.get("/submitted-students", codeController.getSubmittedStudents);

/**
 * @swagger
 * /code/{studentID}:
 *   get:
 *     summary: Get student code
 *     tags: [Admin-Code]
 *     parameters:
 *       - in: path
 *         name: studentID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student's code
 */
// Get student code - supports both GET with param and POST with body
router.get("/:studentID", codeController.getStudentCode);

/**
 * @swagger
 * /code:
 *   post:
 *     summary: Get student code (POST variant)
 *     tags: [Admin-Code]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentID:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student's code
 */
router.post("/", codeController.getStudentCode);

export default router;
