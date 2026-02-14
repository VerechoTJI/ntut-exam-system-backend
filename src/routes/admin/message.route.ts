import { Router } from "express";
import * as messageController from "../../controllers/admin/message.controller";

const router = Router();

router.post("/", messageController.sendMessageToUser);
router.get("/", messageController.getAllMessages);

export default router;
