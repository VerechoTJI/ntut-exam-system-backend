import { Router } from "express";
import * as messageController from "../../controllers/user/message.controller";

const router = Router();

router.get("/all", messageController.getMessagesAfterId);
router.get("/config-version", messageController.getConfigVersion);
router.get("/message-version", messageController.getMessageVersion);

export default router;
