import crypto from "crypto";
import { StudentNetwork } from "../models/StudentNetwork";
import userLogService, { type CreateLogInput } from "./UserLogService";
import { Op } from 'sequelize';

class LoggerDeps {
  async createLog(data: CreateLogInput): Promise<any> {
    return await userLogService.createLog(data);
  }
}

type AlertResult =
  | {
    alert: true;
    type:
    | "more than one user on same ip"
    | "more than one user on same mac"
    | "more than one user on same ip and mac"
    | "using different device";
    messeage: string;
  }
  | {
    alert: false;
    type: "update Info" | "no alert detected";
    messeage: string;
  };

export class StudentNetworkService {
  constructor(
    private readonly logger: LoggerDeps,
    private readonly model = StudentNetwork
  ) { }

  /** 初始化多筆學生資料。清空 MAC/IP，為每筆產生新的 PSK，並重設 is_get_key。 */
  async initializeStudents(
    students: Array<{ id: string; name: string }>
  ): Promise<StudentNetwork[]> {
    const results: StudentNetwork[] = [];
    for (const s of students) {
      const psk = this.generatePsk();
      const record = await this.model.upsert(
        {
          studentID: s.id,
          name: s.name,
          macAddress: null,
          ipAddress: null,
          pskKey: psk,
          isGetKey: false,
        },
        { returning: true }
      );
      results.push(Array.isArray(record) ? record[0] : record);
    }
    return results;
  }

  /**
   * 新增或更新單一學生的 MAC/IP。
   * - 保留反作弊檢查（IP/MAC 衝突、異裝置）。
   * - 僅當資料庫欄位為 null 時才寫入本次傳入的 IP/MAC；不覆寫既有值。
   * - 不會自行新增資料，若學生不存在則拋出錯誤。
   */
  async addOrUpdateStudentNetwork(params: {
    studentID: string;
    name: string;
    macAddress: string;
    ipAddress: string;
  }): Promise<{ record: StudentNetwork; alertResult: AlertResult }> {
    const { studentID, name, macAddress, ipAddress } = params;
    const existing = await this.model.findOne({ where: { studentID } });

    if (!existing) {
      throw new Error(`student ${studentID} not found; no record created`);
    }

    const psk = existing.pskKey ?? this.generatePsk();

    // 找出與他人重複使用的 IP / MAC
    const conflictIpUser = await this.model.findOne({
      where: { ipAddress, studentID: { [Op.ne]: studentID as any } },
    });
    const conflictMacUser = await this.model.findOne({
      where: { macAddress, studentID: { [Op.ne]: studentID as any } },
    });

    let alertResult: AlertResult | null = null;

    if (conflictIpUser && conflictMacUser) {
      alertResult = {
        alert: true,
        type: "more than one user on same ip and mac",
        messeage: `mac and ip already used by user ${conflictIpUser.studentID}`,
      };
    } else if (conflictIpUser) {
      alertResult = {
        alert: true,
        type: "more than one user on same ip",
        messeage: `ip already used by user ${conflictIpUser.studentID}`,
      };
    } else if (conflictMacUser) {
      alertResult = {
        alert: true,
        type: "more than one user on same mac",
        messeage: `mac already used by user ${conflictMacUser.studentID}`,
      };
    } else if (
      (existing.ipAddress && existing.ipAddress !== ipAddress) ||
      (existing.macAddress && existing.macAddress !== macAddress)
    ) {
      alertResult = {
        alert: true,
        type: "using different device",
        messeage: `${studentID} is using another device`,
      };
    }

    // 僅當欄位為 null 時才更新為本次輸入的 IP/MAC
    const updates: Partial<StudentNetwork> = {};
    if (existing.ipAddress === null && ipAddress) {
      updates.ipAddress = ipAddress;
    }
    if (existing.macAddress === null && macAddress) {
      updates.macAddress = macAddress;
    }
    if (name && name !== existing.name) {
      updates.name = name;
    }
    // 維持既有 psk / isGetKey，不自動重置
    updates.pskKey = psk;
    updates.isGetKey = existing.isGetKey ?? false;

    let saved = existing;
    if (Object.keys(updates).length > 0) {
      saved = await existing.update(updates);
    }

    // 若未產生 alert，根據是否有實際更新給予提示
    if (!alertResult) {
      if (
        (existing.ipAddress === null && updates.ipAddress) ||
        (existing.macAddress === null && updates.macAddress)
      ) {
        alertResult = {
          alert: false,
          type: "update Info",
          messeage: "successfully update user's devices",
        };
      } else {
        alertResult = {
          alert: false,
          type: "no alert detected",
          messeage: "no alert",
        };
      }
    }

    return { record: saved, alertResult };
  }

  /** 清除指定學生的 MAC/IP（保留 PSK），並重設 is_get_key。 */
  async clearStudentDevices(studentID: string): Promise<StudentNetwork | null> {
    const existing = await this.model.findOne({ where: { studentID } });
    if (!existing) return null;

    await existing.update({ macAddress: null, ipAddress: null, isGetKey: false });
    return existing;
  }

  /**
   * 首次領取 PSK 時回傳 key 並標記 is_get_key = true。
   * 非首次領取則回傳 false。若學生不存在則回傳 null。
   */
  async getKey(studentID: string): Promise<string | false | null> {
    const student = await this.model.findOne({ where: { studentID } });
    if (!student) return null;

    if (!student.isGetKey) {
      await student.update({ isGetKey: true });
      return student.pskKey;
    }
    return false;
  }

  /**
   * 手動設定 is_get_key 狀態，允許重新取得 PSK。
   * @param studentID 學號
   * @param isGetKey  目標狀態（true/false）
   * @returns 更新後的資料列；若找不到則回傳 null
   */
  async setIsGetKey(
    studentID: string,
    isGetKey: boolean
  ): Promise<StudentNetwork | null> {
    const student = await this.model.findOne({ where: { studentID } });
    if (!student) return null;

    await student.update({ isGetKey });
    return student;
  }

  /** 依照學號取得學生資料 (MAC | IP | PSK) */
  async getNetworkByStudentID(studentID: string): Promise<{
    macAddress: string | null;
    ipAddress: string | null;
    pskKey: string;
  } | null> {
    const student = await this.model.findOne({ where: { studentID } });
    if (!student) return null;
    return {
      macAddress: student.macAddress,
      ipAddress: student.ipAddress,
      pskKey: student.pskKey,
    };
  }

  /** 依照學號搜尋學生是否已存在 */
  async exists(studentID: string): Promise<boolean> {
    const count = await this.model.count({ where: { studentID } });
    return count > 0;
  }

  private generatePsk(length = 32): string {
    return crypto.randomBytes(length / 2).toString("hex");
  }
}

const studentNetworkService = new StudentNetworkService(new LoggerDeps());
export default studentNetworkService;