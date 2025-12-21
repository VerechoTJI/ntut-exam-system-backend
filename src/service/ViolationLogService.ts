import { Op } from "sequelize";
import ViolationLog, { ViolationType } from "../models/ViolationLog";

export interface LogViolationInput {
    studentId: string;
    ipAddress?: string | null;
    type: ViolationType;
    messeage: string;
    time?: Date;
}

export interface LogViolationResult {
    record: ViolationLog;
    /** true when a record was created or timestamp was updated */
    updated: boolean;
}

/**
 * Service for handling violation logs.
 */
export class ViolationLogService {
    constructor(private readonly model = ViolationLog) { }

    /**
     * Log a violation:
     * - If there is an existing row with the same studentId, type, messeage and is_ok = false,
     *   do NOT insert a new row; update the timestamp instead.
     * - Otherwise, insert a new row.
     */
    async log(data: LogViolationInput): Promise<LogViolationResult> {
        const { studentId, ipAddress = null, type, messeage, time = new Date() } = data;

        const existing = await this.model.findOne({
            where: {
                studentId,
                type,
                messeage,
                isOk: false,
            },
        });

        if (existing) {
            await existing.update({ time, ipAddress });
            return { record: existing, updated: true };
        }

        const created = await this.model.create({
            studentId,
            ipAddress,
            type,
            messeage,
            time,
            isOk: false,
        });
        return { record: created, updated: true };
    }

    /** Mark a record as ok by id. */
    async setOkStatus(id: number): Promise<ViolationLog | null> {
        const record = await this.model.findByPk(id);
        if (!record) return null;
        await record.update({ isOk: true });
        return record;
    }

    /** Get all violation records. */
    async getAll(): Promise<ViolationLog[]> {
        return await this.model.findAll({ order: [["time", "DESC"]] });
    }

    /** Get a single record by id. */
    async getById(id: number): Promise<ViolationLog | null> {
        return await this.model.findByPk(id);
    }

    /** Get all records for a given studentId. */
    async getByStudentId(studentId: string): Promise<ViolationLog[]> {
        return await this.model.findAll({
            where: { studentId },
            order: [["time", "DESC"]],
        });
    }

    /** Delete a record by id. Returns true if deleted, false if not found. */
    async deleteById(id: number): Promise<boolean> {
        const deletedCount = await this.model.destroy({ where: { id } });
        return deletedCount > 0;
    }
}

const violationLogService = new ViolationLogService();
export default violationLogService;