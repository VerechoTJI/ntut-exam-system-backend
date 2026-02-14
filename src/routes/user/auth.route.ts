import { Router } from "express";
import * as authController from "../../controllers/user/auth.controller";
import { verifyUserAccessTokenMiddleware } from "../../middlewares/auth-user-token";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User-Auth
 *   description: Student authentication
 */

/**
 * @swagger
 * /auth/check-id:
 *   post:
 *     summary: Check if student ID exists
 *     tags: [User-Auth]
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
 *         description: Student ID exists
 */
// Check if student ID exists
router.post("/check-id", authController.checkStudentId);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register user crypto info (one-time registration)
 *     tags: [User-Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               encryptedPayload:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
// Register user crypto info (one-time registration)
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/public-key:
 *   get:
 *     summary: Get system RSA public key
 *     tags: [User-Auth]
 *     responses:
 *       200:
 *         description: System RSA Public Key
 */
// Get system RSA public key
router.get("/public-key", authController.getPublicKeyHandler);

/**
 * @swagger
 * /auth/verify-token:
 *   post:
 *     summary: Verify user token
 *     tags: [User-Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 */
// Verify user token (requires token)
router.post(
  "/verify-token",
  verifyUserAccessTokenMiddleware,
  authController.verifyToken,
);

export default router;
