import { Router } from "express";
import * as initController from "../../controllers/admin/init.controller";

const router = Router();

router.post("/init", initController.init);
router.post("/reset", initController.reset);
router.get("/status", initController.getStatus);
router.put("/status", initController.updateStatus);

export default router;
