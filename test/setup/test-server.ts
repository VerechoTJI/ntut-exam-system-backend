import express, { Express } from "express";
import { createTestDatabase, closeTestDatabase } from "./test-database";

/**
 * 創建測試用的 Express 應用程式
 */
export const createTestApp = async (): Promise<Express> => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 初始化測試資料庫
  await createTestDatabase();

  return app;
};

/**
 * 關閉測試伺服器
 */
export const closeTestApp = async () => {
  await closeTestDatabase();
};
