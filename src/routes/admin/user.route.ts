import * as userController from '../../controllers/admin/user.controller';
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'this is user management route' });
});

/**
 * @swagger
 * tags:
 *   name: Admin-User
 *   description: User management
 */

/**
 * @swagger
 * /admin/user/crypto/{studentID}:
 *   delete:
 *     summary: Delete user's crypto info and network info by student ID
 *     tags: [Admin-User]
 *     parameters:
 *       - in: path
 *         name: studentID
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID of the user to delete crypto info for
 *     responses:
 *       200:
 *         description: User crypto info deleted successfully
 *       404:
 *         description: User crypto info not found
 */
router.delete('/crypto', userController.deleteUserCrypto);

/**
 * @swagger
 * /admin/user/devices/{studentID}:
 *   get:
 *     summary: Get user's device info
 *     tags: [Admin-User]
 *     parameters:
 *       - in: path
 *         name: studentID
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID of the user to get device info for
 *     responses:
 *       200:
 *         description: User device info retrieved successfully
 *       404:
 *         description: User device info not found
 */
router.get('/devices', userController.getUserDevicesInfo);

router.get('/crypto/exist', userController.getUserCryptoExist);

export default router;