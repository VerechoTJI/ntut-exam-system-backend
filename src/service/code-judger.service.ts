import { pistonJudger, CompareMode, JudgeResult } from "piston-judger";
import JudgerConfig from "../constants/piston.config";
import { ExecutionRequest, PistonSubtaskReply } from "../types/judger.type";
import { ErrorHandler } from "../middlewares/error-handler";
import systemSettingsService from "./SystemSettingsServices";
import codeStorage from "./CodeStorage";
import { getZipFilePath } from "../utils/file-operator.util";
import { ExamConfig, SubTask, TestCase } from "../schemas/config.schemas";
import { ScoreBoardFormat, ScoreResultFormat, TestCaseRecord } from "../types/scoreboard.type";
import { Puzzle } from "../types/config.type.js";
import pLimit from "p-limit";

const MAX_CONCURRENT_JUDGES = 20;

const client = pistonJudger({ server: JudgerConfig.url });

export function getJudgeRequest(puzzle: Puzzle): ExecutionRequest {
  return {
    language: puzzle.language,
    version: JudgerConfig.languages[puzzle.language].version,
    run_timeout: puzzle.timeLimit,
    run_memory_limit: puzzle.memoryLimit,
    compare_mode: puzzle.compareMode || "loose",
  };
}

function getSubTasks(config: ExamConfig, questionIndex: number): SubTask[] {
  const puzzles = config.puzzles;
  return puzzles[questionIndex].subtasks as SubTask[];
}

function getPuzzles(config: ExamConfig, questionIndex: number): Puzzle {
  const puzzles = config.puzzles;
  const puzzle: Puzzle = puzzles[questionIndex];
  return puzzle;
}

async function judgeTestCases(
  testCases: TestCase[],
  options: ExecutionRequest,
  codeString: string,
): Promise<JudgeResult[]> {
  const promises = testCases.map((tc) =>
    client
      .execute(options.language, options.version, {
        ...options,
        stdin: tc.input,
        code: codeString,
      })
      .then((res) =>
        client.judge(res, {
          expectedOutput: tc.output ?? "",
          compareMode: options.compare_mode || "loose",
        }),
      ),
  );

  const results = await Promise.allSettled(promises);

  return results.map((r) => {
    if (r.status === "fulfilled") {
      return r.value;
    } else {
      return {
        status: "CE",
        message:
          (r as PromiseRejectedResult).reason?.message ||
          "Failed to judge test case, internal error.",
        actualOutput: "",
      } as JudgeResult;
    }
  });
}

export async function judgePuzzle(
  subTasks: SubTask[],
  request: ExecutionRequest,
  codeString: string,
): Promise<PistonSubtaskReply[]> {
  const promises = subTasks.map(async (st) => {
    if (!Array.isArray(st.visible) || !Array.isArray(st.hidden)) {
      throw new ErrorHandler(500, "SubTask 的 visible 和 hidden 必須是陣列");
    }

    const [visibleResults, hiddenResults] = await Promise.all([
      judgeTestCases(st.visible, request, codeString),
      judgeTestCases(st.hidden, request, codeString),
    ]);

    return {
      title: st.title,
      visible: visibleResults,
      hidden: hiddenResults,
    };
  });

  return Promise.all(promises);
}

export async function judgeAllSubmittedPuzzles(
  studentID: string,
  fileNames: string[],
): Promise<ScoreResultFormat> {
  if (fileNames.length === 0) return {};

  const config = await systemSettingsService.getConfig();
  if (!config) throw new ErrorHandler(500, "No system config found");

  const limit = pLimit(MAX_CONCURRENT_JUDGES);

  const judgeTasks = fileNames.map((problemID) => {
    // 使用 limit 包裝異步邏輯
    return limit(async () => {
      // 1. 讀取程式碼
      const codeString = await codeStorage.unzipGetFileAsString(
        getZipFilePath(studentID),
        problemID,
      );

      // 2. 取得題目索引與配置
      const questionIndex = codeStorage.getFileNameWithoutExt(problemID);
      const subTasks = getSubTasks(config, Number(questionIndex));
      const puzzle = getPuzzles(config, Number(questionIndex));

      // 3. 執行評測
      const result = await judgePuzzle(
        subTasks,
        getJudgeRequest(puzzle),
        codeString,
      );

      return { problemID, result };
    });
  });

  // 這裡的 Promise.all 會同時啟動所有 task，但 p-limit 會確保同一時間只有 15 個在跑
  const completedTasks = await Promise.all(judgeTasks);

  const allResults: ScoreResultFormat = {};
  for (const task of completedTasks) {
    allResults[task.problemID] = task.result;
  }
  return allResults;
}

// export function updateJudgeResult(original: ScoreResultFormat) {}