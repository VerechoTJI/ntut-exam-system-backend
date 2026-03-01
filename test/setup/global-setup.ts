import { config } from "dotenv";
import path from "path";

/**
 * 全域測試設定
 * 在所有測試開始前執行
 */
export default async function globalSetup() {
  // 載入測試環境變數
  config({ path: path.resolve(process.cwd(), ".env.test") });

  // 設置預設測試環境變數（如果 .env.test 不存在）
  process.env.NODE_ENV = "test";
  process.env.TEST_USE_REAL_DB = process.env.TEST_USE_REAL_DB || "false";
  process.env.JUDGER_URL = process.env.JUDGER_URL || "http://localhost:2000";

  console.log("🧪 測試環境初始化完成");
}
