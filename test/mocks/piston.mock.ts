import { JudgeResult } from "piston-judger";

/**
 * Mock Piston Judger 回應
 */
export const mockPistonJudgeResult = (
  status: "AC" | "WA" | "TLE" | "RE" | "CE" = "AC",
): JudgeResult => {
  return {
    status,
    message: status === "AC" ? "Accepted" : "Wrong Answer",
    actualOutput: status === "AC" ? "Expected output" : "Wrong output",
    expectedOutput: "Expected output",
    details: {
      isCompilationError: false,
      isRuntimeError: false,
      isTimeoutError: status === "TLE",
      isMemoryExceeded: false,
      isOutPutLimitExceeded: false,
      isServerError: false,
      runInfo: {
        cpuTime: 100,
        wallTime: 150,
        memory: 1024,
      },
      compileInfo: {
        code: null,
        stderr: "",
        message: null,
      },
    },
  } as JudgeResult;
};

/**
 * Mock Piston 多個測試案例的結果
 */
export const mockPistonMultipleResults = (
  count: number,
  status: "AC" | "WA" | "TLE" | "RE" | "CE" = "AC",
): JudgeResult[] => {
  return Array(count)
    .fill(null)
    .map(() => mockPistonJudgeResult(status));
};

/**
 * Mock Piston Client 測試案例結果
 */
export const mockClientTestCaseRecord = (statusCode: string = "AC") => {
  return {
    statusCode,
    userOutput: statusCode === "AC" ? "Expected output" : "Wrong output",
    expectingOutput: "Expected output",
    time: "100",
  };
};
