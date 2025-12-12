import { AlertLog, AlertType } from "../models/AlertLog";
import userLogService from "./UserLogService";
import socketService from "../socket/SocketService";

export interface AlertInput {
    studentID: string;
    type: AlertType;
    messageID: string;
    time: Date;
    ip: string;
    messeage: string;
}
export class AlertLogService {
    private _cooldownMs = 2 * 60 * 1000; // 兩分鐘
    private _lastRunAt = 0;
    private _pendingRun: Promise<void> | null = null;
    private _pendingTimer: NodeJS.Timeout | null = null;

    /**
     * 兩分鐘冷卻機制：
     * - 兩分鐘內若已執行過，等冷卻期結束再執行一次。
     * - 冷卻期內的多次呼叫共用同一筆待執行工作。
     * - 不回傳資料結果（僅確保執行）。
     */
    async updateAndCheckAlerts(): Promise<void> {
        console.warn("updateAndCheckAlerts() called.");
        const now = Date.now();
        const elapsed = now - this._lastRunAt;
        const remaining = this._cooldownMs - elapsed;

        // 冷卻已過且沒有排程 → 立即執行
        if (remaining <= 0 && !this._pendingRun) {
            await this.runOnce();
            console.warn("Alert check executed immediately.");
            return;
        }

        // 冷卻中 → 如無排程則排一筆；若已有排程則重用
        if (!this._pendingRun) {
            console.warn("Alert check scheduled after cooldown.");
            this._pendingRun = new Promise((resolve, reject) => {
                this._pendingTimer = setTimeout(async () => {
                    try {
                        await this.runOnce();
                        resolve();
                    } catch (err) {
                        reject(err);
                    } finally {
                        this._pendingRun = null;
                        this._pendingTimer = null;
                    }
                }, Math.max(remaining, 0));
            });
        }

        await this._pendingRun;
    }

    /**
     * 管理員強制更新後，用這個函式重新計時冷卻：
     * - 取消已排程的執行
     * - 重置最近執行時間（預設從「現在」重新開始計時）
     */
    resetCooldown(startFromNow: boolean = true) {
        if (this._pendingTimer) {
            clearTimeout(this._pendingTimer);
            this._pendingTimer = null;
        }
        this._pendingRun = null;
        this._lastRunAt = startFromNow ? Date.now() : 0;
    }

    public async runOnce(): Promise<void> {
        this._lastRunAt = Date.now();
        const alerts = await userLogService.checkSecurityAlerts();
        const createdAlerts = await this.addFromAlerts(alerts);
        console.dir(alerts, { depth: null });
        socketService.triggerAlertEvent(createdAlerts);
    }

    /**
     * Bulk add alerts from checkSecurityAlerts results.
     * Skips if an alert with the same studentID + type + messageID already exists
     * (especially those already marked is_ok).
     */
    async addFromAlerts(alerts: AlertInput[]) {
        const created: AlertLog[] = [];
        for (const alert of alerts) {
            const exists = await AlertLog.findOne({
                where: {
                    studentID: alert.studentID,
                    type: alert.type,
                    messageID: alert.messageID,
                },
            });
            if (exists) continue;

            const record = await AlertLog.create({
                ...alert,
                time: alert.time ?? new Date(),
            });
            created.push(record);
        }
        return created;
    }

    async addLog(alert: AlertInput) {
        const record = await AlertLog.create({
            ...alert,
            time: alert.time ?? new Date(),
        });
        return record;
    }

    async deleteLog(id: string) {
        const count = await AlertLog.destroy({ where: { id } });
        return count > 0;
    }

    async setOkStatus(id: string, isOk: boolean) {
        const [count] = await AlertLog.update({ is_ok: isOk }, { where: { id } });
        return count > 0;
    }

    async getAll() {
        return AlertLog.findAll({ order: [['time', 'DESC']] });
    }

    async getById(id: string) {
        return AlertLog.findByPk(id);
    }
}

const alertLogService = new AlertLogService();
export default alertLogService;