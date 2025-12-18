import { UserActionLog } from "../models/UserActionLog";
import { Sequelize } from "sequelize-typescript";
import { AlertInput as AlertItem } from "./AlertLogService";

interface CreateLogInput {
  student_ID: string;
  ip_address: string;
  action_type: string;
  details: string;
}

export class UserLogService {
  /**
   * 1. 新增一筆資料
   */
  async createLog(data: CreateLogInput) {
    try {
      const log = await UserActionLog.create({
        ...data,
        timestamp: new Date(), // 確保寫入當下時間
      });
      console.log(`✅ Log created for ${data.student_ID}`);
      return log;
    } catch (error) {
      console.error("❌ Create log failed:", error);
      throw error;
    }
  }

  /**
   * 2. 刪除資料 by id
   */
  async deleteLogById(id: number) {
    try {
      const count = await UserActionLog.destroy({
        where: { id },
      });
      if (count === 0) {
        console.log(`⚠️ No log found with id: ${id}`);
        return false;
      }
      console.log(`✅ Log ${id} deleted`);
      return true;
    } catch (error) {
      console.error("❌ Delete log failed:", error);
      throw error;
    }
  }

  /**
   * 3. 篩選資料：單一學生的所有紀錄
   */
  async getLogsByStudent(studentID: string) {
    try {
      const logs = await UserActionLog.findAll({
        where: { student_ID: studentID },
        order: [["timestamp", "DESC"]],
      });
      return logs;
    } catch (error) {
      console.error("❌ Get logs by student failed:", error);
      throw error;
    }
  }

  /**
   * 4. 篩選資料：單一 IP 的所有紀錄
   */
  async getLogsByIp(ipAddress: string) {
    try {
      const logs = await UserActionLog.findAll({
        where: { ip_address: ipAddress },
        order: [["timestamp", "DESC"]],
      });
      return logs;
    } catch (error) {
      console.error("❌ Get logs by IP failed:", error);
      throw error;
    }
  }

  /**
   * 5. Alert 檢查功能
   * 回傳符合條件的學號以及 IP
   */
  async checkSecurityAlerts(): Promise<AlertItem[]> {
    try {
      const alerts: AlertItem[] = [];

      const quitAlerts = await this.getQuitAlerts();
      const duplicateIpAlerts = await this.getDuplicateIpAlerts();
      const multipleUsersSameIpAlerts =
        await this.getMultipleUsersSameIpAlerts();

      alerts.push(
        ...quitAlerts,
        ...duplicateIpAlerts,
        ...multipleUsersSameIpAlerts
      );

      if (alerts.length > 0) {
        console.warn("🚨 SECURITY ALERT TRIGGERED 🚨");
      }

      return alerts;
    } catch (error) {
      console.error("❌ Security check failed:", error);
      throw error;
    }
  }

  /**
   * 6. 清空該表單
   */
  async clearAllLogs() {
    try {
      await UserActionLog.destroy({
        where: {},
        truncate: true,
      });
      console.log("✅ All logs cleared");
    } catch (error) {
      console.error("❌ Clear logs failed:", error);
      throw error;
    }
  }

  // === 以下為分拆後的三種警告檢查 ===

  /**
   * (1) 觸發登出警告：details 包含 "Application On Quit"
   */
  private async getQuitAlerts(): Promise<AlertItem[]> {
    const quitLogs = await UserActionLog.findAll({
      where: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("details")),
        "LIKE",
        "%application on quit%"
      ),
      order: [["timestamp", "DESC"]],
      raw: true,
    });

    return quitLogs.map((log: any) => ({
      studentID: log.student_ID,
      type: "Try to quit the app",
      messageID: String(log.id),
      time: log.timestamp,
      ip: log.ip_address,
      messeage: log.details,
    }));
  }

  /**
   * (2) 觸發登入不同 IP 警告：同一學生出現 2 個以上不同 IP
   */
  private async getDuplicateIpAlerts(): Promise<AlertItem[]> {
    const suspiciousStudents = await UserActionLog.findAll({
      attributes: [
        "student_ID",
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("ip_address"))
          ),
          "unique_ip_count",
        ],
      ],
      group: ["student_ID"],
      having: Sequelize.where(
        Sequelize.fn(
          "COUNT",
          Sequelize.fn("DISTINCT", Sequelize.col("ip_address"))
        ),
        ">=",
        2
      ),
      raw: true,
    });

    if (suspiciousStudents.length === 0) return [];

    const studentIDs = suspiciousStudents.map((s: any) => s.student_ID);

    // 取每個學生最新的一筆紀錄作為 alert 的訊息來源
    const latestLogs = await UserActionLog.findAll({
      where: { student_ID: studentIDs },
      order: [
        ["student_ID", "ASC"],
        ["timestamp", "DESC"],
      ],
      raw: true,
    });

    const alerts: AlertItem[] = [];
    const seen = new Set<string>();
    for (const log of latestLogs) {
      if (seen.has(log.student_ID)) continue;
      seen.add(log.student_ID);
      alerts.push({
        studentID: log.student_ID,
        type: "duplicate ip devices",
        messageID: String(log.id),
        time: log.timestamp,
        ip: log.ip_address,
        messeage: log.details,
      });
    }

    return alerts;
  }

  /**
   * (3) 觸發多重登入同 IP 警告：同一 IP 有多個不同學生登入
   * 規則：同一 IP 的第一位登入者不報警，後續不同學生登入同 IP 時觸發警告
   */
  private async getMultipleUsersSameIpAlerts(): Promise<AlertItem[]> {
    // 找出有 2 個以上不同學生的 IP
    const sharedIps = await UserActionLog.findAll({
      attributes: [
        "ip_address",
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("student_ID"))
          ),
          "student_count",
        ],
      ],
      group: ["ip_address"],
      having: Sequelize.where(
        Sequelize.fn(
          "COUNT",
          Sequelize.fn("DISTINCT", Sequelize.col("student_ID"))
        ),
        ">=",
        2
      ),
      raw: true,
    });

    if (sharedIps.length === 0) return [];

    const ipList = sharedIps.map((s: any) => s.ip_address);

    // 拉出這些 IP 的所有 log，依 IP、時間排序
    const logs = await UserActionLog.findAll({
      where: { ip_address: ipList },
      order: [
        ["ip_address", "ASC"],
        ["timestamp", "ASC"],
      ],
      raw: true,
    });

    const alerts: AlertItem[] = [];
    // 記錄每個 IP 已出現過的第一位學生
    const firstStudentByIp = new Map<string, string>();
    // 避免同一學生在同一 IP 重複觸發多次，使用集合去重
    const alertedStudentByIp = new Map<string, Set<string>>();

    for (const log of logs) {
      const ip = log.ip_address;
      const student = log.student_ID;

      if (!firstStudentByIp.has(ip)) {
        // 第一位登入者記錄後略過
        firstStudentByIp.set(ip, student);
        continue;
      }

      // 若同一學生已在此 IP 觸發過警告，略過
      if (!alertedStudentByIp.has(ip)) {
        alertedStudentByIp.set(ip, new Set<string>());
      }
      const alertedSet = alertedStudentByIp.get(ip)!;
      if (alertedSet.has(student)) continue;

      // 若不是第一位學生，觸發警告
      if (student !== firstStudentByIp.get(ip)) {
        alerts.push({
          studentID: student,
          type: "multiple users same ip",
          messageID: String(log.id),
          time: log.timestamp,
          ip: ip,
          messeage: log.details,
        });
        alertedSet.add(student);
      }
    }

    return alerts;
  }
  async getAllLogs() {
    try {
      const logs = await UserActionLog.findAll({
        order: [["timestamp", "DESC"]],
      });
      return logs;
    } catch (error) {
      console.error("❌ Get all logs failed:", error);
      throw error;
    }
  }
}

const userLogService = new UserLogService();
export default userLogService;
