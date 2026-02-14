import { Server, Socket } from "socket.io";

export class MessageSocketService {
  private io: Server;
  private static instance: MessageSocketService;

  private constructor(io: Server) {
    this.io = io;
    this.setupConnectionHandler();
  }

  public static initialize(io: Server): MessageSocketService {
    if (!MessageSocketService.instance) {
      MessageSocketService.instance = new MessageSocketService(io);
    }
    return MessageSocketService.instance;
  }

  public static getInstance(): MessageSocketService {
    if (!MessageSocketService.instance) {
      throw new Error(
        "MessageSocketService not initialized. Call initialize() first.",
      );
    }
    return MessageSocketService.instance;
  }

  private setupConnectionHandler(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`User message socket connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`User message socket disconnected: ${socket.id}`);
      });
    });
  }

  public emitEvent(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public static sendMessage(messageData: {
    id: number;
    type: string;
    message: string;
  }): void {
    const instance = MessageSocketService.getInstance();
    instance.emitEvent("exam-message", {
      success: true,
      data: messageData,
    });
  }

  public static sendConfigUpdateNotification(messageId: number): void {
    const instance = MessageSocketService.getInstance();
    instance.emitEvent("exam-message", {
      success: true,
      data: {
        id: messageId,
        type: "config_update",
        message: "Exam configuration has been updated",
      },
    });
  }
}

export default MessageSocketService;
