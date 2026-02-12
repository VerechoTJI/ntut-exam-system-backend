import { Router } from "express";
import authRoute from "./auth.route";
import examRoute from "./exam.route";
import logRoute from "./log.route";

const router = Router();

// Mount sub-routes
router.use("/auth", authRoute);
router.use("/exam", examRoute);
router.use("/log", logRoute);

export default router;
