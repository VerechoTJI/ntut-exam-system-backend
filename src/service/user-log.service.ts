import { UserActionLog } from "../models/UserActionLog";
import { Sequelize } from "sequelize-typescript";

export interface CreateLogInput {
  student_ID: string;
  ip_address: string;
  mac_address: string;
  action_type: string;
  details: string;
}

export class UserLogService {
  /** 1. 新增一筆資料 */
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

  /** 2. 刪除資料 by id */
  async deleteLogById(id: number) {
    try {
      const count = await UserActionLog.destroy({ where: { id } });
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

  /** 3. 篩選資料：單一學生的所有紀錄 */
  async getLogsByStudent(studentID: string) {
    try {
      return await UserActionLog.findAll({
        where: { student_ID: studentID },
        order: [["timestamp", "DESC"]],
      });
    } catch (error) {
      console.error("❌ Get logs by student failed:", error);
      throw error;
    }
  }

  /** 4. 篩選資料：單一 IP 的所有紀錄 */
  async getLogsByIp(ipAddress: string) {
    try {
      return await UserActionLog.findAll({
        where: { ip_address: ipAddress },
        order: [["timestamp", "DESC"]],
      });
    } catch (error) {
      console.error("❌ Get logs by IP failed:", error);
      throw error;
    }
  }

  /** 4-1. 篩選資料：單一 MAC 的所有紀錄 */
  async getLogsByMac(macAddress: string) {
    try {
      return await UserActionLog.findAll({
        where: { mac_address: macAddress },
        order: [["timestamp", "DESC"]],
      });
    } catch (error) {
      console.error("❌ Get logs by MAC failed:", error);
      throw error;
    }
  }

  /** 6. 清空該表單 */
  async clearAllLogs() {
    try {
      await UserActionLog.destroy({ where: {}, truncate: true });
      console.log("✅ All logs cleared");
    } catch (error) {
      console.error("❌ Clear logs failed:", error);
      throw error;
    }
  }
  /** 取得所有 logs */
  async getAllLogs() {
    try {
      return await UserActionLog.findAll({
        order: [["timestamp", "DESC"]],
      });
    } catch (error) {
      console.error("❌ Get all logs failed:", error);
      throw error;
    }
  }
  async getLastNLogs(n: number) {
    try {
      return await UserActionLog.findAll({
        order: [["timestamp", "DESC"]],
        limit: n,
      });
    } catch (error) {
      console.error("❌ Get last N logs failed:", error);
      throw error;
    }
  }
}

const userLogService = new UserLogService();
export default userLogService;