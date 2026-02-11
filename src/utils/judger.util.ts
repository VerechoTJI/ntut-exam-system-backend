import { JudgeResult } from "piston-judger";
import { TestCaseRecord, ClientTestCaseRecord, ScoreResultFormat, ScoreBoardFormat, ClientResultFormat } from "../types/scoreboard.type";

function mapPistonJudgeResultsToScoreBoardFormat(
    pistonResults: JudgeResult
): TestCaseRecord {
    return {
        status: pistonResults.status,
        userOutput: pistonResults.actualOutput || "",
        expectedOutput: pistonResults.expectedOutput || "",
        time: pistonResults.details?.runInfo.cpuTime.toString() || "0",
    };
}

function mapClientJudgeResultsToScoreBoardFormat(
    clientResults: ClientTestCaseRecord
): TestCaseRecord {
    return {
        status: clientResults.statusCode,
        userOutput: clientResults.userOutput,
        expectedOutput: clientResults.expectingOutput,
        time: clientResults.time,
    };
}

function updatePistonSubtaskReplyToScoreBoardFormat(
    pistonSubtaskReply: ScoreResultFormat,
    originalScoreboard: ScoreBoardFormat
): ScoreBoardFormat {
    let updatedScoreboard: ScoreBoardFormat = { ...originalScoreboard };

    for (let problemID in pistonSubtaskReply) {
        let subtaskReplies = pistonSubtaskReply[problemID];
        let hiddenStatus: TestCaseRecord[] = [];
        let visibleStatus: TestCaseRecord[] = [];

        for (let subtaskReply of subtaskReplies) {
            for (let hiddenResult of subtaskReply.hidden) {
                hiddenStatus.push(mapPistonJudgeResultsToScoreBoardFormat(hiddenResult));
            }
            for (let visibleResult of subtaskReply.visible) {
                visibleStatus.push(mapPistonJudgeResultsToScoreBoardFormat(visibleResult));
            }
        }

        updatedScoreboard[problemID] = {
            hidden: hiddenStatus,
            visible: visibleStatus,
        };
    }

    return updatedScoreboard;
}


function updateClientJudgeResultToScoreBoardFormat(
    clientResults: ClientResultFormat,
    originalScoreboard: ScoreBoardFormat
): ScoreBoardFormat {
    let updatedScoreboard: ScoreBoardFormat = { ...originalScoreboard };
    for (let problemID in clientResults) {
        let testCaseRecords = clientResults[problemID];
        let hiddenStatus: TestCaseRecord[] = [];
        let visibleStatus: TestCaseRecord[] = [];

        for (let subtasks of testCaseRecords) {
            for (let hiddenResult of subtasks.hidden) {
                hiddenStatus.push(mapClientJudgeResultsToScoreBoardFormat(hiddenResult));
            }
            for (let visibleResult of subtasks.visible) {
                visibleStatus.push(mapClientJudgeResultsToScoreBoardFormat(visibleResult));
            }
        }

        updatedScoreboard[problemID] = {
            hidden: hiddenStatus,
            visible: visibleStatus,
        };
    }

    return updatedScoreboard;
}

export {
    updatePistonSubtaskReplyToScoreBoardFormat,
    updateClientJudgeResultToScoreBoardFormat
};