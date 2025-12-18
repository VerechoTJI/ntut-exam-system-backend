import express from "express";
import cors from "cors";
import session from "express-session";
import userAPI from "./routes/userAPI";
import { connectDB } from "./config/database";

const userApp = express();

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

// 一般對外 API，CORS 開放
userApp.use(
  cors({
    origin: "*",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
userApp.use(express.json());
userApp.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// 對外的 user 路由
userApp.use("/api", userAPI);

userApp.get("/", (req, res) => {
  res.send("This is public user api server.");
});

export default userApp;
