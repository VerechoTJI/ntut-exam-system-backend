import { Request, Response, NextFunction } from "express";
import * as messageService from "../../service/message.service";

/**
 * Get config version (latest config update message ID)
 * GET /user/config-version
 */
export const getConfigVersion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const version = await messageService.getLatestConfigVersion();
    res.status(200).json({
      success: true,
      data: {
        version,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get message version (latest message ID)
 * GET /user/message-version
 */
export const getMessageVersion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const version = await messageService.getLatestMessageVersion();
    res.status(200).json({
      success: true,
      data: {
        version,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages after a specific ID
 * GET /user/messages?lastId=xxx
 */
export const getMessagesAfterId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const lastId = parseInt(req.query.lastId as string) || 0;
    const messages = await messageService.getMessagesAfterId(lastId);
    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
