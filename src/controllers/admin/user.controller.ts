import { deleteUserCryptoInfo } from "../../service/user-crypto.service";
import studentNetworkService from "../../service/student-network.service";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../../middlewares/error-handler";

import { sanitizeStudentID } from "../../utils/guard.util";


export const deleteUserCrypto = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { studentID } = req.query;
        const sanitizedStudentID = sanitizeStudentID(studentID as string);
        if (!sanitizedStudentID) {
            throw new ErrorHandler(400, "Missing required field: studentID");
        }
        const success = await deleteUserCryptoInfo(sanitizedStudentID);
        const isNetworkRecordDeleted = await studentNetworkService.clearStudentDevices(sanitizedStudentID);
        if (success && isNetworkRecordDeleted) {
            res.status(200).json({
                success: true,
                message: `User crypto info for studentID ${sanitizedStudentID} deleted successfully`,
            });
        } else {
            res.status(404).json({
                success: false,
                message: `User crypto info for studentID ${sanitizedStudentID} not found`,
            });
        }
    } catch (error) {
        next(error);
    }
}

export const getUserDevicesInfo = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { studentID } = req.query;
        if (!studentID || typeof studentID !== "string") {
            throw new ErrorHandler(400, "Missing required field: studentID");
        }
        const sanitizedStudentID = sanitizeStudentID(studentID as string);
        if (!sanitizedStudentID) {
            throw new ErrorHandler(400, "Invalid studentID format");
        }
        console.log(`Fetching device info for studentID: ${sanitizedStudentID}`);
        const networkInfo = await studentNetworkService.getNetworkByStudentID(sanitizedStudentID);
        console.log(`Device info for studentID ${sanitizedStudentID}:`, networkInfo);
        if (networkInfo) {
            res.status(200).json({
                success: true,
                data: networkInfo,
            });
        } else {
            res.status(404).json({
                success: false,
                message: `Network info for studentID ${sanitizedStudentID} not found`,
            });
        }
    } catch (error) {
        next(error);
    }
}