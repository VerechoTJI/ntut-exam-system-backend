import userLogService, { type CreateLogInput } from "./UserLogService";
import studentNetworkService from "./StudentNetwork";
import violationLogService from "./ViolationLogService";
import { SocketService } from "../socket/SocketService";

/**
 * Anti-cheat coordination service.
 */
export class AntiCheatService {
    constructor(
        private readonly userLogs = userLogService,
        private readonly network = studentNetworkService,
        private readonly violations = violationLogService
    ) { }

    /**
     * - Log user action.
     * - Run student network anti-cheat checks.
     * - Detect "Application On Quit" in details as cheating.
     * - If cheating, log to violations.
     * - If violation log was created/updated, emit socket alert with all violations.
     */
    async logWithAntiCheat(
        input: CreateLogInput & { studentName?: string }
    ): Promise<{
        alertResult: Awaited<ReturnType<typeof studentNetworkService["addOrUpdateStudentNetwork"]>>["alertResult"];
        violationRecord: any | null;
    }> {
        // 1) log user action
        await this.userLogs.createLog(input);

        // 1-1) skip anti-cheat for unknown student_ID
        if (input.student_ID == "unknown" || input.student_ID == "") {
            return
        }

        // 2) run network anti-cheat
        const networkResult = await this.network.addOrUpdateStudentNetwork({
            studentID: input.student_ID,
            name: input.studentName ?? input.student_ID,
            macAddress: input.mac_address,
            ipAddress: input.ip_address,
        });

        // 3) detect cheating
        const hasQuitPhrase =
            typeof input.details === "string" &&
            input.details.includes("Application On Quit");
        const isCheating = networkResult.alertResult.alert || hasQuitPhrase;

        let violationRecord = null;
        let violationUpdated = false;

        if (isCheating) {
            const violationType = hasQuitPhrase ? "Application On Quit" : "AlertResult";
            const violationMessage = hasQuitPhrase
                ? input.details
                : networkResult.alertResult.messeage;

            const v = await this.violations.log({
                studentId: input.student_ID,
                ipAddress: input.ip_address,
                type: violationType,
                messeage: violationMessage,
            });
            violationRecord = v.record;
            violationUpdated = v.updated;
        }

        // 4) emit alert when violation log changed
        if (violationUpdated) {
            const allViolations = await this.violations.getAll();
            SocketService.triggerAlertEvent(allViolations);
        }

        return { alertResult: networkResult.alertResult, violationRecord };
    }
}

const antiCheatService = new AntiCheatService();
export default antiCheatService;