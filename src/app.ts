import express from "express";
const pathToSwaggerUi = require("swagger-ui-dist").absolutePath();
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import cors from "cors";
import session from "express-session";
import adminAPI from "./routes/adminApi";
import userAPI from "./routes/userAPI";
import { connectDB } from "./config/database";

const app = express();

(async () => {
  await connectDB();
})();

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

// 這裡只定義「可以設定在 app 上的共用 middleware」
// 注意：CORS 先設寬一點，後面在 admin server 再額外加嚴格限制
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(express.json());

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(express.json());

// 這裡只掛「user 的 API」
app.use("/api", userAPI);

app.get("/", function (req, res) {
  res.send("This is user's api");
});

export default app;
