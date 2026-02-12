import { Request, Response, NextFunction } from "express";
import scoreBoardService from "../../service/scoreboard.service";
import {
  registerUserCryptoInfo,
  getPublicKey,
  decryptNVerrifyUserAccessToken,
} from "../../service/user-crypto.service";
import { ErrorHandler } from "../../middlewares/error-handler";
import systemSettingsService from "../../service/sys-settings.service";

/**
 * Check if student ID exists
 * POST /user/auth/check-id
 * Body: { studentID: string }
 */
export const checkStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentID } = req.body;

    if (!studentID) {
      throw new ErrorHandler(400, "Missing required field: studentID");
    }

    const studentInfo = await systemSettingsService.getStudentInfo(studentID);

    if (!studentInfo) {
      throw new ErrorHandler(404, "Student ID not found");
    }

    res.status(200).json({
      success: true,
      data: {
        studentID: studentInfo.id,
        name: studentInfo.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register user crypto info
 * POST /user/auth/register
 * Body: { encryptedPayload: string }
 * A student can only register once
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { encryptedPayload } = req.body;

    if (!encryptedPayload) {
      throw new ErrorHandler(400, "Missing required field: encryptedPayload");
    }

    await registerUserCryptoInfo(encryptedPayload);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system RSA public key
 * GET /user/auth/public-key
 */
export const getPublicKeyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const publicKey = getPublicKey();

    res.status(200).json({
      success: true,
      data: {
        publicKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user token
 * POST /user/auth/verify-token
 * Headers: x-user-token
 * Body: { studentID: string }
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentID } = req.body;
    const encryptedToken = req.headers["x-user-token"] as string | undefined;

    if (!studentID) {
      throw new ErrorHandler(400, "Missing required field: studentID");
    }

    if (!encryptedToken) {
      throw new ErrorHandler(401, "Missing user token in headers");
    }

    const isValid = await decryptNVerrifyUserAccessToken(
      studentID,
      encryptedToken,
    );

    res.status(200).json({
      success: true,
      data: {
        valid: isValid,
      },
    });
  } catch (error) {
    next(error);
  }
};
