import { Request, Response, NextFunction } from "express";
import * as configService from "../../service/config.service";
import systemSettingsService from "../../service/sys-settings.service";
import * as messageService from "../../service/message.service";
import { MessageSocketService } from "../../socket/MessageSocketService";

/**
 * Create exam configuration
 * POST /admin/config
 */
export const createConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const examConfig = req.body;
    await configService.createConfig(examConfig);
    res.status(201).json({
      success: true,
      message: "Exam configuration created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update exam configuration
 * PUT /admin/config
 */
export const updateConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const examConfig = req.body;
    await configService.updateConfig(examConfig);

    // Create a config update message and send socket notification
    const message = await messageService.createMessage(
      messageService.MessageType.CONFIG_UPDATE,
      "Exam configuration has been updated",
    );

    // Trigger socket notification to all connected users
    MessageSocketService.sendConfigUpdateNotification(message.id);

    res.status(200).json({
      success: true,
      message: "Exam configuration updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get exam configuration
 * GET /admin/config
 */
export const getConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = await systemSettingsService.getConfig();
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update test case (only input/output)
 * Only allowed after exam has started
 * PUT /admin/config/testcase
 */
export const updateTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const examConfig = req.body;
    const result = await configService.updateTestCase(examConfig);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.updatedConfig,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    next(error);
  }
};
