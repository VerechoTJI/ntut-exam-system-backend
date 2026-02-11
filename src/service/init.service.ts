import { Puzzle, AccessUser, ExamConfig } from "../schemas/config.schemas";
import { StatusCode } from "piston-judger";
import { ScoreBoardFormat, TestCaseRecord } from "../types/scoreboard.type";
import { getClientScoreboard } from "../utils/init-db.util";
import { ScoreBoard } from "../models/ScoreBoard";
import { ErrorHandler } from "../middlewares/error-handler";
import systemSettingsService from "../service/SystemSettingsServices";


async function initClientScoreBoard(
    accessableUsers: AccessUser[],
    defaultScoreboard: ScoreBoardFormat[],
): Promise<void> {
    const records = accessableUsers.map((user, index) => {
        return {
            student_ID: user.id,
            student_name: user.name,
            last_submit_time: null,
            puzzle_results: defaultScoreboard,
        }
    });
    try {
        await ScoreBoard.bulkCreate(records, {
            updateOnDuplicate: [
                "student_name",
                "puzzle_results",
            ],
        });
    } catch (error) {
        throw new ErrorHandler(500, "Fail to initialize scoreboard");
    }
}



async function init(
    examConfig: ExamConfig,
    users: AccessUser[],
): Promise<void> {
    try {
        const defaultScoreboard = getClientScoreboard(examConfig.puzzles);
        await initClientScoreBoard(users, defaultScoreboard);
        await systemSettingsService.saveConfig(examConfig);
        // await systemSettingsService.saveStudentList(users);
        await systemSettingsService.updateConfigAvailability(true);

    } catch (error) {
        throw new ErrorHandler(500, "Fail to initialize the exam system");
    }
}
