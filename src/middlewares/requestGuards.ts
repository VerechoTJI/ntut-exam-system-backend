import { Request, Response, NextFunction } from "express";
import antiCheatService from "../service/AntiCheatService";
import { sanitizeStudentID } from "../controllers/user.controller";

/** Simple async wrapper to avoid repeating try/catch in middleware */
const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
        (req: Request, res: Response, next: NextFunction) =>
            Promise.resolve(fn(req, res, next)).catch(next);

const isValidMac = (mac: string) =>
    /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac || "");

const extractStudentId = (req: Request) =>
    (req.body?.studentID ?? req.query?.studentID ?? "").toString();
const extractMac = (req: Request) =>
    (req.body?.macAddress ?? req.query?.macAddress ?? "").toString();
const extractIp = (req: Request) =>
    (req.body?.ipAddress ??
        req.query?.ipAddress ??
        req.ip ??
        req.socket.remoteAddress ??
        "") as string;

/** Middleware: validate studentID & macAddress (all routes except /status and /get-config) */
export const validateStudentAndMac = asyncHandler(async (req, res, next) => {
    if (req.path === "/status" || req.path === "/get-config") return next();

    const studentID = extractStudentId(req);
    const mac = extractMac(req);

    if (!studentID || sanitizeStudentID(studentID) !== studentID) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid or missing studentID" });
    }

    if (!mac || !isValidMac(mac)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid or missing macAddress" });
    }

    return next();
});

/** Middleware: /get-config must include ipAddress */
export const requireIpForGetConfig = asyncHandler(async (req, res, next) => {
    if (req.path !== "/get-config") return next();
    const ipAddress = extractIp(req);
    if (!ipAddress) {
        return res
            .status(400)
            .json({ success: false, message: "Missing ipAddress" });
    }
    return next();
});

/** Middleware: Anti-cheat check for all routes except /status */
export const antiCheatMiddleware = asyncHandler(async (req, _res, next) => {
    if (req.path === "/status") return next();

    const studentID = extractStudentId(req) || "unknown";
    const mac = extractMac(req);
    const ip = extractIp(req) || "unknown";
    const action_type = `route:${req.method} ${req.path}`;
    const details =
        typeof req.body?.details === "string"
            ? req.body.details
            : JSON.stringify(req.body ?? {});

    await antiCheatService.logWithAntiCheat({
        student_ID: studentID,
        ip_address: ip,
        mac_address: mac,
        action_type,
        details,
    });

    return next();
});