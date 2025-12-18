import express from "express";
import cors from "cors";
import session from "express-session";
import adminAPI from "./routes/adminApi";
import { connectDB } from "./config/database";

const adminApp = express();

// (async () => {
//   await connectDB();
// })();

declare module "express-session" {
  interface SessionData {
    [key: string]: any;
  }
}

declare global {
  namespace Express {
    interface Request {
      sessionID: string;
    }
  }
}

// CORS 視需求決定，要不要開放；如果只在本機用，可以很嚴格
adminApp.use(
  cors({
    origin: true, // 或你要的管理用前端網址
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
adminApp.use(express.json());
adminApp.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// 中介層：只允許本機 IP
adminApp.use((req, res, next) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.connection.remoteAddress ||
    "";

  // 常見本機 IP 表現：127.0.0.1, ::1, ::ffff:127.0.0.1
  const isLocal =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip === "::ffff:127.0.0.1%lo0" ||
    ip === "172.18.0.1"; // Docker 環境下的本機 IP，請修改成你需要的
  if (!isLocal) {
    return res
      .status(403)
      .json({ message: "Forbidden: admin only from localhost", yourIP: ip });
  }

  next();
});

// 只允許從 /admin 存取 adminAPI
adminApp.use("/admin", adminAPI);

adminApp.get("/", (req, res) => {
  res.send("This is admin api server.");
});

export default adminApp;
