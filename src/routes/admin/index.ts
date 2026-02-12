import { Router } from "express";
import initRoute from "./init.route";
import configRoute from "./config.route";
import codeRoute from "./code.route";
import anticheatRoute from "./anticheat.route";
import scoreboardRoute from "./scoreboard.route";

const router = Router();

router.use("/", initRoute);
router.use("/config", configRoute);
router.use("/code", codeRoute);
router.use("/anticheat", anticheatRoute);
router.use("/scoreboard", scoreboardRoute);

export default router;
