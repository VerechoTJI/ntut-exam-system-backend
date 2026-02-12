import { Router } from "express";
import * as configController from "../../controllers/admin/config.controller";

const router = Router();

// Create exam configuration
router.post("/", configController.createConfig);

// Update exam configuration
router.put("/", configController.updateConfig);

// Get exam configuration
router.get("/", configController.getConfig);

// Update test case (only allowed after exam has started)
router.put("/testcase", configController.updateTestCase);

export default router;
