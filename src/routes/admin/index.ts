import { Router } from "express";
import initRoute from "./init.route";
import configRoute from "./config.route";
import codeRoute from "./code.route";
import anticheatRoute from "./anticheat.route";
import scoreboardRoute from "./scoreboard.route";
import messageRoute from "./message.route";
import logRoute from "./log.route";
import userRoute from "./user.route";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Check if Admin API is running
 *     tags: [Admin-Base]
 *     responses:
 *       200:
 *         description: Admin API is running
 */
router.get("/", (req, res) => {
  return res.json({ message: "Admin API is running." });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Admin-Base]
 *     responses:
 *       200:
 *         description: Server status ok
 */
router.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

router.use("/", initRoute);
router.use("/config", configRoute);
router.use("/code", codeRoute);
router.use("/anticheat", anticheatRoute);
router.use("/scoreboard", scoreboardRoute);
router.use("/message", messageRoute);
router.use("/logs", logRoute);
router.use("/user", userRoute);
export default router;
