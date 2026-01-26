import { Request, Response, NextFunction } from 'express';
import { decryptNVerrifyUserAccessToken } from '../service/user-crypto.service';
import { ErrorHandler } from '../middlewares/error-handler';

export async function verifyUserAccessTokenMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const studentID = req.body?.studentID || req.query?.studentID || req.params?.studentID;
        const encryptedToken = req.headers['x-user-token'] as string | undefined;

        if (!studentID) {
            throw new ErrorHandler(400, 'studentID is required');
        }
        if (!encryptedToken) {
            throw new ErrorHandler(401, 'User token is required');
        }

        await decryptNVerrifyUserAccessToken(studentID, encryptedToken);
        return next();
    } catch (error) {
        return next(error);
    }
}