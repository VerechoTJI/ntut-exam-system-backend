import { ScoreBoard } from "../models/ScoreBoard";
import {
  ScoreBoardFormat,
  Subtasks,
  PuzzleResultPayload,
} from "../types/scoreboard.type";

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

function unwrapSubtasks(puzzleResult: ScoreBoardFormat[string]): Subtasks[] {
  // Legacy shape: Subtasks[]
  if (Array.isArray(puzzleResult)) {
    return puzzleResult;
  }

  // New shape: { subtasks, specialRuleResults }
  if (puzzleResult && typeof puzzleResult === "object") {
    const subtasks = (puzzleResult as PuzzleResultPayload).subtasks;
    if (Array.isArray(subtasks)) return subtasks;
  }

  // Defensive fallback (corrupt payload)
  return [];
}

export function getPassedPuzzleAmount(scoreboard: ScoreBoardFormat) {
  let passedPuzzleAmount = 0;
  let puzzleAmount = 0;
  let subtaskAmount = 0;
  let passedSubtaskAmount = 0;
  for (let problemID in scoreboard) {
    const subtasks = unwrapSubtasks(scoreboard[problemID]);
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
