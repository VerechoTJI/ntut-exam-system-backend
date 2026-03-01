import { Router } from "express";
import * as logController from "../../controllers/admin/log.controller";

const router = Router();
router.get("/ip", logController.getLogsByIp);
router.get("/all", logController.getAllLogs);
router.get("/student", logController.getLogsByStudentId);
export default router;
