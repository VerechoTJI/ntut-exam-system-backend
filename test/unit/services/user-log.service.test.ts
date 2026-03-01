import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  UserLogService,
  CreateLogInput,
} from "../../../src/service/user-log.service";
import { UserActionLog } from "../../../src/models/UserActionLog";
import {
  createTestDatabase,
  closeTestDatabase,
  clearTestDatabase,
} from "../../setup/test-database";

describe("UserLog Service - Unit Tests", () => {
  let userLogService: UserLogService;

  beforeAll(async () => {
    await createTestDatabase();
    userLogService = new UserLogService();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe("createLog", () => {
    it("應該成功建立一筆 log 記錄", async () => {
      const logData: CreateLogInput = {
        student_ID: "A12345678",
        ip_address: "192.168.1.100",
        mac_address: "00:11:22:33:44:55",
        action_type: "LOGIN",
        details: "User logged in successfully",
      };

      const result = await userLogService.createLog(logData);

      expect(result).not.toBeNull();
      expect(result.student_ID).toBe("A12345678");
      expect(result.ip_address).toBe("192.168.1.100");
      expect(result.action_type).toBe("LOGIN");
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("應該為每筆 log 自動設定時間戳記", async () => {
      const logData: CreateLogInput = {
        student_ID: "B98765432",
        ip_address: "192.168.1.101",
        mac_address: "AA:BB:CC:DD:EE:FF",
        action_type: "SUBMIT",
        details: "Code submitted",
      };

      const result = await userLogService.createLog(logData);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(
        new Date().getTime(),
      );
    });
  });

  describe("deleteLogById", () => {
    it("應該成功刪除指定 ID 的 log", async () => {
      const log = await UserActionLog.create({
        student_ID: "C11111111",
        ip_address: "192.168.1.102",
        mac_address: "11:22:33:44:55:66",
        action_type: "LOGOUT",
        details: "User logged out",
        timestamp: new Date(),
      });

      const result = await userLogService.deleteLogById(log.id);

      expect(result).toBe(true);

      const deletedLog = await UserActionLog.findByPk(log.id);
      expect(deletedLog).toBeNull();
    });

    it("應該在 log 不存在時返回 false", async () => {
      const result = await userLogService.deleteLogById(99999);

      expect(result).toBe(false);
    });
  });

  describe("getLogsByStudent", () => {
    it("應該取得指定學生的所有 logs", async () => {
      await UserActionLog.bulkCreate([
        {
          student_ID: "D22222222",
          ip_address: "192.168.1.103",
          mac_address: "AA:AA:AA:AA:AA:AA",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date("2024-01-01"),
        },
        {
          student_ID: "D22222222",
          ip_address: "192.168.1.103",
          mac_address: "AA:AA:AA:AA:AA:AA",
          action_type: "SUBMIT",
          details: "Submit",
          timestamp: new Date("2024-01-02"),
        },
        {
          student_ID: "E33333333",
          ip_address: "192.168.1.104",
          mac_address: "BB:BB:BB:BB:BB:BB",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date("2024-01-03"),
        },
      ]);

      const results = await userLogService.getLogsByStudent("D22222222");

      expect(results).toHaveLength(2);
      results.forEach((log) => {
        expect(log.student_ID).toBe("D22222222");
      });
      // 應該按時間降冪排序（最新的在前）
      expect(results[0].timestamp.getTime()).toBeGreaterThan(
        results[1].timestamp.getTime(),
      );
    });

    it("應該在沒有 logs 時返回空陣列", async () => {
      const results = await userLogService.getLogsByStudent("NONEXISTENT");

      expect(results).toHaveLength(0);
    });
  });

  describe("getLogsByIp", () => {
    it("應該取得指定 IP 的所有 logs", async () => {
      await UserActionLog.bulkCreate([
        {
          student_ID: "F44444444",
          ip_address: "192.168.1.200",
          mac_address: "CC:CC:CC:CC:CC:CC",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date(),
        },
        {
          student_ID: "G55555555",
          ip_address: "192.168.1.200",
          mac_address: "DD:DD:DD:DD:DD:DD",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date(),
        },
        {
          student_ID: "H66666666",
          ip_address: "192.168.1.201",
          mac_address: "EE:EE:EE:EE:EE:EE",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date(),
        },
      ]);

      const results = await userLogService.getLogsByIp("192.168.1.200");

      expect(results).toHaveLength(2);
      results.forEach((log) => {
        expect(log.ip_address).toBe("192.168.1.200");
      });
    });
  });

  describe("getLogsByMac", () => {
    it("應該取得指定 MAC 的所有 logs", async () => {
      await UserActionLog.bulkCreate([
        {
          student_ID: "I77777777",
          ip_address: "192.168.1.202",
          mac_address: "FF:FF:FF:FF:FF:FF",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date(),
        },
        {
          student_ID: "J88888888",
          ip_address: "192.168.1.203",
          mac_address: "FF:FF:FF:FF:FF:FF",
          action_type: "LOGOUT",
          details: "Logout",
          timestamp: new Date(),
        },
      ]);

      const results = await userLogService.getLogsByMac("FF:FF:FF:FF:FF:FF");

      expect(results).toHaveLength(2);
      results.forEach((log) => {
        expect(log.mac_address).toBe("FF:FF:FF:FF:FF:FF");
      });
    });
  });

  describe("clearAllLogs", () => {
    it("應該清空所有 logs", async () => {
      await UserActionLog.bulkCreate([
        {
          student_ID: "K99999999",
          ip_address: "192.168.1.204",
          mac_address: "11:11:11:11:11:11",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date(),
        },
        {
          student_ID: "L00000000",
          ip_address: "192.168.1.205",
          mac_address: "22:22:22:22:22:22",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date(),
        },
      ]);

      await userLogService.clearAllLogs();

      const allLogs = await UserActionLog.findAll();
      expect(allLogs).toHaveLength(0);
    });
  });

  describe("getAllLogs", () => {
    it("應該取得所有 logs 並按時間降冪排序", async () => {
      await UserActionLog.bulkCreate([
        {
          student_ID: "M11111111",
          ip_address: "192.168.1.206",
          mac_address: "33:33:33:33:33:33",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date("2024-01-01"),
        },
        {
          student_ID: "N22222222",
          ip_address: "192.168.1.207",
          mac_address: "44:44:44:44:44:44",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date("2024-01-03"),
        },
        {
          student_ID: "O33333333",
          ip_address: "192.168.1.208",
          mac_address: "55:55:55:55:55:55",
          action_type: "LOGIN",
          details: "Login",
          timestamp: new Date("2024-01-02"),
        },
      ]);

      const results = await userLogService.getAllLogs();

      expect(results).toHaveLength(3);
      // 最新的在前
      expect(results[0].student_ID).toBe("N22222222");
      expect(results[1].student_ID).toBe("O33333333");
      expect(results[2].student_ID).toBe("M11111111");
    });
  });

  describe("getLastNLogs", () => {
    it("應該取得最近的 N 筆 logs", async () => {
      await UserActionLog.bulkCreate([
        {
          student_ID: "P11111111",
          ip_address: "192.168.1.209",
          mac_address: "66:66:66:66:66:66",
          action_type: "LOGIN",
          details: "Login 1",
          timestamp: new Date("2024-01-01"),
        },
        {
          student_ID: "P11111111",
          ip_address: "192.168.1.209",
          mac_address: "66:66:66:66:66:66",
          action_type: "LOGIN",
          details: "Login 2",
          timestamp: new Date("2024-01-02"),
        },
        {
          student_ID: "P11111111",
          ip_address: "192.168.1.209",
          mac_address: "66:66:66:66:66:66",
          action_type: "LOGIN",
          details: "Login 3",
          timestamp: new Date("2024-01-03"),
        },
        {
          student_ID: "P11111111",
          ip_address: "192.168.1.209",
          mac_address: "66:66:66:66:66:66",
          action_type: "LOGIN",
          details: "Login 4",
          timestamp: new Date("2024-01-04"),
        },
      ]);

      const results = await userLogService.getLastNLogs(2);

      expect(results).toHaveLength(2);
      expect(results[0].details).toBe("Login 4");
      expect(results[1].details).toBe("Login 3");
    });

    it("應該在資料少於 N 筆時返回所有資料", async () => {
      await UserActionLog.create({
        student_ID: "Q11111111",
        ip_address: "192.168.1.210",
        mac_address: "77:77:77:77:77:77",
        action_type: "LOGIN",
        details: "Login",
        timestamp: new Date(),
      });

      const results = await userLogService.getLastNLogs(10);

      expect(results).toHaveLength(1);
    });
  });
});
