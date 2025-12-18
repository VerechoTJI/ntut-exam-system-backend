import http from "http";
import { Server } from "socket.io";
import userApp from "./user-app";
import adminApp from "./admin-app";
import socketService from "./socket/SocketService";
import { connectDB } from "./config/database";

(async () => {
  await connectDB();
})();

// 對外的 user server
const USER_PORT = Number(process.env.USER_PORT) || 3001;
const userServer = http.createServer(userApp);

userServer.listen(USER_PORT, "0.0.0.0", () => {
  console.log(`User server is running on port ${USER_PORT}`);
});

// 只給本機用的 admin server
const ADMIN_PORT = Number(process.env.ADMIN_PORT) || 3002;
// 這裡綁 127.0.0.1，外部機器連不到這個 port
const adminServer = http.createServer(adminApp);

const io = new Server(adminServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// 初始化 socketService
socketService.initialize(io);

io.on("connection", (socket) => {
  console.log("Admin socket connected:", socket.id);

  socket.on("msg", (data) => {
    console.log("Admin message received:", data);
    io.emit("msg", data);
  });
});

adminServer.listen(ADMIN_PORT, "0.0.0.0", () => {
  console.log(`Admin server is running on http://0.0.0.0:${ADMIN_PORT}`);
});
