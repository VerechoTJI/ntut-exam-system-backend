import { Request, Response, NextFunction } from "express";
import * as messageService from "../../service/message.service";
import { MessageSocketService } from "../../socket/MessageSocketService";

/**
 * Send message to users
 * POST /admin/send-message-to-user
 */
export const sendMessageToUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: "Type and message are required",
      });
    }

    // Create message in database
    const newMessage = await messageService.createMessage(type, message);

    // Send socket notification to all connected users
    MessageSocketService.sendMessage({
      id: newMessage.id,
      type: newMessage.type,
      message: newMessage.message,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: newMessage.id,
        type: newMessage.type,
        message: newMessage.message,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all messages
 * GET /admin/messages
 */
export const getAllMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const messages = await messageService.getAllMessages();
    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
