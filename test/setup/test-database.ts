import { Sequelize } from "sequelize-typescript";
import { ScoreBoard } from "../../src/models/ScoreBoard";
import { UserActionLog } from "../../src/models/UserActionLog";
import { SystemSettings } from "../../src/models/SystemSettings";
import { StudentNetwork } from "../../src/models/StudentNetwork";
import { ViolationLog } from "../../src/models/ViolationLog";
import { UserCryptoKey } from "../../src/models/UserCryptoKey";
import { Message } from "../../src/models/Message";

let testSequelize: Sequelize;

/**
 * 創建測試用的資料庫連線
 * 使用 SQLite in-memory 進行快速測試
 */
export const createTestDatabase = async (): Promise<Sequelize> => {
  // 如果測試環境需要連接到真實的測試資料庫，可以使用環境變數
  const useRealDB = process.env.TEST_USE_REAL_DB === "true";

  if (useRealDB) {
    testSequelize = new Sequelize({
      dialect: "postgres",
      host: process.env.TEST_DB_HOST || "localhost",
      port: parseInt(process.env.TEST_DB_PORT || "5433", 10),
      username: process.env.TEST_DB_USER || "testuser",
      password: process.env.TEST_DB_PASS || "testpassword",
      database: process.env.TEST_DB_NAME || "testdatabase",
      models: [
        ScoreBoard,
        UserActionLog,
        SystemSettings,
        ViolationLog,
        StudentNetwork,
        UserCryptoKey,
        Message,
      ],
      logging: false,
    });
  } else {
    // 使用 SQLite in-memory 進行單元測試
    testSequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      models: [
        ScoreBoard,
        UserActionLog,
        SystemSettings,
        ViolationLog,
        StudentNetwork,
        UserCryptoKey,
        Message,
      ],
      logging: false,
    });
  }

  await testSequelize.authenticate();
  await testSequelize.sync({ force: true });

  return testSequelize;
};

/**
 * 關閉測試資料庫連線
 */
export const closeTestDatabase = async () => {
  if (testSequelize) {
    await testSequelize.close();
  }
};

/**
 * 清空所有測試資料表
 */
export const clearTestDatabase = async () => {
  if (testSequelize) {
    await testSequelize.truncate({ cascade: true, restartIdentity: true });
  }
};

/**
 * 取得測試資料庫實例
 */
export const getTestDatabase = () => testSequelize;
