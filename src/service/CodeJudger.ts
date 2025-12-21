import axios from "axios";
import systemSettingsService from "../service/SystemSettingsServices";
import { TestConfig } from "../types/InitService";
import codeStorage from "./CodeStorage";
import piston from "../utilities/piston";
// import piston from "piston-client";
import path from "path";
import { serve } from "swagger-ui-express";
import scoreBoardService from "./ScoreBoardService";

const JUDGER_URL = process.env.JUDGER_URL || "http://localhost:2000";

// 從環境變數讀取限制（可選）
const CPU_TIME_LIMIT_MS = process.env.JUDGE_CPU_TIME_LIMIT_MS
  ? Number(process.env.JUDGE_CPU_TIME_LIMIT_MS)
  : 10000; // 預設 10 秒
const WALL_TIME_LIMIT_MS = process.env.JUDGE_WALL_TIME_LIMIT_MS
  ? Number(process.env.JUDGE_WALL_TIME_LIMIT_MS)
  : 15000; // 預設 15 秒
const MEMORY_LIMIT_KB = process.env.JUDGE_MEMORY_LIMIT_KB
  ? Number(process.env.JUDGE_MEMORY_LIMIT_KB)
  : 102400; // 預設 100 MB

export type TestCase = {
  id: string;
  input: string;
  output?: string;
};

export type JudgeAllResult = {
  problemID: string;
  results: JudgeResult[];
};

export async function judgeAllCodeInStorage(
  studentID: string,
  fileNames: string[]
): Promise<JudgeAllResult[] | false> {
  if (fileNames.length === 0) {
    return false;
  }
  let newFilePaths = fileNames.map((fileName) => {
    return fileName.replace(".py", "");
  });
  let allResults: JudgeAllResult[] = [];
  for (let problemID of newFilePaths) {
    const rawPath = path.join(__dirname, `../upload/${studentID}.zip`);
    const posixZipFilePath = path.posix.normalize(rawPath.replace(/\\/g, "/"));
    const zipFileString = await codeStorage.unzipGetFileAsString(
      posixZipFilePath, // <-- 使用修正過的路徑
      `${problemID}.py`
    );
    const testCases = await getTestCases(problemID);
    const results = await judgeSingleCode(testCases, zipFileString);
    allResults.push({ problemID: problemID, results: results });
  }
  const previousScoreboard = await scoreBoardService.getScoreByStudentId(
    studentID
  );
  if (!previousScoreboard) {
    return false;
  }
  const mappedScoreboard = mapJudgeResultsToScoreBoardFormat(
    allResults,
    previousScoreboard.puzzle_results
  );
  await scoreBoardService.updateStudentScoreFromJudgeResults(
    studentID,
    mappedScoreboard,
    Object.values(mappedScoreboard).filter((v) => v === true).length
  );
  return allResults;
}

export async function getTestCases(questionID: string): Promise<TestCase[]> {
  const config = await systemSettingsService.getConfig();
  if (!config) {
    throw new Error("No config found");
  }
  const puzzles = config.puzzles;
  let testCases: TestCase[] = [];
  for (const question of puzzles) {
    if (question.id !== questionID) {
      continue;
    }
    for (const group of question.testCases) {
      for (const openTestCase of group.openTestCases) {
        testCases.push({
          id: openTestCase.id as string,
          input: openTestCase.input,
          output: openTestCase.output,
        });
      }
      for (const hiddenTestCase of group.hiddenTestCases) {
        testCases.push({
          id: hiddenTestCase.id as string,
          input: hiddenTestCase.input,
          output: hiddenTestCase.output,
        });
      }
    }
  }
  return testCases;
}
export type JudgeResult = {
  testCaseID: string;
  success: boolean;
  messeage: string; // 注意：依你的需求保留「messeage」拼字
};

/**
 * 使用 node-piston 對單一程式碼進行多筆測資評測
 *
 * @param testCases 測資陣列（每筆包含輸入與期望輸出）
 * @param programString 程式碼字串
 * @param options 可選項目：語言、版本、超時、記憶體限制等
 *
 * 預設語言：python，版本（可由 /runtimes 查得）：3.10.0（常見）
 */
export async function judgeSingleCode(
  testCases: TestCase[],
  programString: string,
  options?: {
    language?: string; // e.g. 'python'
    version?: string; // e.g. '3.10.0'（可用 client.runtimes() 查）
    runTimeoutMs?: number; // 執行超時（毫秒）
    runMemoryKb?: number; // 記憶體限制（KB）
    args?: string[]; // 命令列參數
    mainFileName?: string; // 主要檔名（Piston 需要檔案名）
  }
): Promise<JudgeResult[]> {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error("testCases 必須是非空陣列");
  }
  const language = options?.language ?? "python";
  const version = options?.version ?? "3.12.0";
  const runTimeoutMs = options?.runTimeoutMs ?? 10000;
  const runMemoryKb = options?.runMemoryKb ?? 100_000; // 256MB
  const args = options?.args ?? [];
  const mainFileName =
    options?.mainFileName ?? (language === "python" ? "main.py" : "main.txt");

  // 建立 Piston Client
  // @ts-ignore
  const client = piston({ server: JUDGER_URL });
  const files = [{ name: mainFileName, content: programString }];
  const normalize = (s: unknown) =>
    typeof s === "string" ? s.replace(/\r\n/g, "\n").trimEnd() : s;

  const results: JudgeResult[] = [];
  for (const tc of testCases) {
    try {
      const res: any = await client.execute({
        language,
        version,
        files,
        stdin: tc.input ?? "",
        args,
        run_timeout: runTimeoutMs,
        run_memory_limit: runMemoryKb,
      });

      const stdout: string = (res?.run?.stdout ?? res?.stdout ?? "") as string;
      const stderr: string = (res?.run?.stderr ?? res?.stderr ?? "") as string;
      const exitCode: number | undefined = (res?.run?.code ?? res?.code) as
        | number
        | undefined;

      const isError = typeof exitCode === "number" && exitCode !== 0;
      let messeage: string;

      if (isError) {
        messeage =
          (stderr && stderr.trim()) ||
          (res?.run?.output ?? res?.output ?? "Runtime Error");
      } else {
        messeage = stdout ?? "";
      }

      // 比對期望輸出（若有）
      const success =
        typeof tc.output === "string"
          ? normalize(stdout) === normalize(tc.output)
          : !isError;

      results.push({
        testCaseID: tc.id,
        success,
        messeage: String(messeage),
      });
    } catch (err: any) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message ?? String(err);
      results.push({
        testCaseID: tc.id,
        success: false,
        messeage: msg,
      });
    }
  }
  return results;
}
function getAxiosErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") return JSON.stringify(data);
    return err.message || "Request Error";
  }
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isAxiosError<T = unknown>(
  error: unknown
): error is { response?: { data?: T }; message?: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

function mapJudgeResultsToScoreBoardFormat(
  data: JudgeAllResult[],
  baseScoreboard: any
) {
  // 複製基底，保留未提供題目的原狀
  const result = { ...baseScoreboard };
  if (!data || !Array.isArray(data)) return result;

  for (const puzzleData of data) {
    if (!puzzleData || typeof puzzleData !== "object") continue;
    const problemID = puzzleData.problemID;

    // 更新 puzzleX_status（僅當該鍵存在於基底時才更新，以避免非預期新增鍵）
    const statusKey = `puzzle${problemID}_status`;
    if (statusKey in result) {
      const allCorrect =
        Array.isArray(puzzleData.results) &&
        puzzleData.results.every((tc) => tc.success === true);
      result[statusKey] = allCorrect;
    }
    // 逐一更新 test case 鍵：puzzle{p}-{groupId}-{testIndex}
    const tcs = Array.isArray(puzzleData.results) ? puzzleData.results : [];
    for (const tc of tcs) {
      if (!tc || typeof tc !== "object") continue;
      // tc.testCaseID 格式為 "groupIndex-testIndex"（例如 "1-3"）
      const parts = String(tc.testCaseID || "").split("-");
      const testIndex = parts[1]; // 取第二段作為 testIndex
      const testCaseKey = `puzzle${problemID}-${parts[0]}-${testIndex}`;
      if (testCaseKey in result) {
        result[testCaseKey] = tc.success;
      }
    }
  }
  return result;
}
