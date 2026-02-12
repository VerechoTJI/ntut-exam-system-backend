import { StatusCode } from "piston-judger/dist/judger.js";
import { AccessUser, Puzzle } from "../schemas/config.schemas.js";
import {
  JudgeResultSocreBoard,
  ScoreBoardFormat,
  TestCaseRecord,
} from "../types/scoreboard.type.js";

const emptyTestCaseRecord: TestCaseRecord = {
  status: StatusCode.WA,
  userOutput: "",
  expectedOutput: "",
  time: "0",
};

export function getClientScoreboard(puzzle: Puzzle[]): ScoreBoardFormat[] {
  let UserScoreBoard: ScoreBoardFormat[] = [];
  for (let problemIndex in puzzle) {
    const problem = puzzle[problemIndex];
    const scoreboard: ScoreBoardFormat = {};
    for (let subtaskIndex in problem.subtasks) {
      const subtask = problem.subtasks[subtaskIndex];
      let visibleTestCases: TestCaseRecord[] = [];
      for (let _ of subtask.visible) {
        visibleTestCases.push({ ...emptyTestCaseRecord });
      }
      let hiddenTestCases: TestCaseRecord[] = [];
      for (let _ of subtask.hidden) {
        hiddenTestCases.push({ ...emptyTestCaseRecord });
      }
      scoreboard[subtaskIndex] = {
        visible: visibleTestCases,
        hidden: hiddenTestCases,
      };
    }
    UserScoreBoard.push(scoreboard);
  }
  return UserScoreBoard;
}
