import express from "express";
import cors from "cors";
import session from "express-session";
// import userAPI from "./routes/
import userRoutes from "./routes/user";
import { connectDB } from "./config/database";
import { errorMiddleware } from "./middlewares/error-handler";

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
  }),
);
userApp.use(express.json());
userApp.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

// 對外的 user 路由
// userApp.use("/api", userAPI);
userApp.use("/api", userRoutes);

userApp.get("/", (req, res) => {
  res.send("This is public user api server.");
});

// Error handling middleware (must be last)
userApp.use(errorMiddleware);

export default userApp;
