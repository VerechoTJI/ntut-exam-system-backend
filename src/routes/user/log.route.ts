import { Router } from "express";
import * as logController from "../../controllers/user/log.controller";

const router = Router();

// Log user action (no token verification required)
router.post("/action", logController.logAction);

export default router;
