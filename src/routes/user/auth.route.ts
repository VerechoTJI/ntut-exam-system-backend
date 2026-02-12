import { Router } from "express";
import * as authController from "../../controllers/user/auth.controller";
import { verifyUserAccessTokenMiddleware } from "../../middlewares/auth-user-token";

const router = Router();

// Check if student ID exists
router.post("/check-id", authController.checkStudentId);

// Register user crypto info (one-time registration)
router.post("/register", authController.register);

// Get system RSA public key
router.get("/public-key", authController.getPublicKeyHandler);

// Verify user token (requires token)
router.post(
  "/verify-token",
  verifyUserAccessTokenMiddleware,
  authController.verifyToken,
);

export default router;
