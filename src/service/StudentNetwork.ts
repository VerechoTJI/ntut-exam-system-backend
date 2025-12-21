import crypto from "crypto";
import { StudentNetwork } from "../models/StudentNetwork";
import userLogService, { type CreateLogInput } from "./UserLogService";

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
   * - 根據 IP / MAC 衝突或裝置更換，回傳對應的 alert 資訊。
   */
  async addOrUpdateStudentNetwork(params: {
    studentID: string;
    name: string;
    macAddress: string;
    ipAddress: string;
  }): Promise<{ record: StudentNetwork; alertResult: AlertResult }> {
    const { studentID, name, macAddress, ipAddress } = params;
    const existing = await this.model.findOne({ where: { studentID } });
    const psk = existing?.pskKey ?? this.generatePsk();

    // 找出與他人重複使用的 IP / MAC
    const conflictIpUser = await this.model.findOne({
      where: { ipAddress, studentID: { ["$ne"]: studentID as any } },
    });
    const conflictMacUser = await this.model.findOne({
      where: { macAddress, studentID: { ["$ne"]: studentID as any } },
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
      existing &&
      ((existing.ipAddress && existing.ipAddress !== ipAddress) ||
        (existing.macAddress && existing.macAddress !== macAddress))
    ) {
      alertResult = {
        alert: true,
        type: "using different device",
        messeage: `${studentID} is using another device`,
      };
    } else if (
      existing &&
      existing.ipAddress === null &&
      existing.macAddress === null
    ) {
      alertResult = {
        alert: false,
        type: "update Info",
        messeage: "successfully update user's devices",
      };
    } else if (
      existing &&
      existing.ipAddress === ipAddress &&
      existing.macAddress === macAddress
    ) {
      alertResult = {
        alert: false,
        type: "no alert detected",
        messeage: "no alert",
      };
    }

    // upsert 資料
    const record = await this.model.upsert(
      {
        studentID,
        name,
        macAddress,
        ipAddress,
        pskKey: psk,
        isGetKey: existing?.isGetKey ?? false,
      },
      { returning: true }
    );
    const saved = Array.isArray(record) ? record[0] : record;

    // 若首次新增資料且尚未有 alertResult，標記為 update Info
    if (!alertResult && !existing) {
      alertResult = {
        alert: false,
        type: "update Info",
        messeage: "successfully update user's devices",
      };
    }

    // 預設保底：若前面皆未命中，視為無警示
    if (!alertResult) {
      alertResult = {
        alert: false,
        type: "no alert detected",
        messeage: "no alert",
      };
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