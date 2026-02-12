import { ScoreBoard } from "../models/ScoreBoard";
import { ScoreBoardFormat, Subtasks } from "../types/scoreboard.type";

const AC = "AC";

function getPassedSubtaskAmount(puzzle: Subtasks[]) {
  let testCaseAmount = 0;
  let passedTestCaseAmount = 0;
  for (let testCase of puzzle) {
    let hiddenPassed = testCase.hidden.every(
      (testCase) => testCase.status === AC,
    );
    let visiblePassed = testCase.visible.every(
      (testCase) => testCase.status === AC,
    );
    if (hiddenPassed && visiblePassed) {
      passedTestCaseAmount++;
    }
    testCaseAmount++;
  }
  return { passedTestCaseAmount, testCaseAmount };
}

export function getPassedPuzzleAmount(scoreboard: ScoreBoardFormat) {
  let passedPuzzleAmount = 0;
  let puzzleAmount = 0;
  let subtaskAmount = 0;
  let passedSubtaskAmount = 0;
  for (let problemID in scoreboard) {
    let subtasks = scoreboard[problemID];
    const { passedTestCaseAmount, testCaseAmount } =
      getPassedSubtaskAmount(subtasks);
    if (passedTestCaseAmount === testCaseAmount) {
      passedPuzzleAmount++;
    }
    puzzleAmount++;
    subtaskAmount += testCaseAmount;
    passedSubtaskAmount += passedTestCaseAmount;
  }
  return {
    passedPuzzleAmount,
    puzzleAmount,
    subtaskAmount,
    passedSubtaskAmount,
  };
}
