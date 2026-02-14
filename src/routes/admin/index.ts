import { Router } from "express";
import initRoute from "./init.route";
import configRoute from "./config.route";
import codeRoute from "./code.route";
import anticheatRoute from "./anticheat.route";
import scoreboardRoute from "./scoreboard.route";
import messageRoute from "./message.route";

const router = Router();

router.get("/", (req, res) => {
  return res.json({ message: "Admin API is running." });
});
router.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});
router.use("/", initRoute);
router.use("/config", configRoute);
router.use("/code", codeRoute);
router.use("/anticheat", anticheatRoute);
router.use("/scoreboard", scoreboardRoute);
router.use("/message", messageRoute);

export default router;
