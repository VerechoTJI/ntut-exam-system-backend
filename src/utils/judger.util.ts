import { TestConfig } from "types/InitService";
import { ErrorHandler } from "../middlewares/error-handler";
import piston from "../utils/piston";
import PISTON_CONFIG from "../constants/piston.config";
// import { JudgeResult } from "service/CodeJudger";
const client = piston({ server: PISTON_CONFIG.JUDGER_URL });



export type JudgeResult = {
    testCaseID: string;
    statusCode: string;
    success: boolean;
    message: string;
};


export type TestCase = {
    id: string;
    input: string;
    output?: string;
};

export type PistonOptions = {
    language?: string; // e.g. 'python'
    version?: string; // e.g. '3.10.0'（可用 client.runtimes() 查）
    run_timeout?: number; // 執行超時（毫秒）
    run_memory_limit?: number; // 記憶體限制（KB）
    args?: string[]; // 命令列參數
    mainFileName?: string; // 主要檔名（Piston 需要檔案名）
}

function getFileName(language: string | undefined): string {
    switch (language) {
        case "python":
            return "main.py";
        case "javascript":
            return "main.js";
        case "cpp":
            return "main.cpp";
        case "java":
            return "Main.java";
        case "c":
            return "main.c";
        default:
            return "main.txt";
    }
}

function getDefaultPistonOptions(config: PistonOptions): PistonOptions {
    if (!config.language) {
        new ErrorHandler(500, "language is required in PistonOptions, received undefined");
    }
    if (!config.version) {
        new ErrorHandler(500, "version is required in PistonOptions, received undefined");
    }
    return {
        language: config.language,
        version: config.version,
        run_timeout: config.run_timeout || PISTON_CONFIG.WALL_TIME_LIMIT_MS,
        run_memory_limit: config.run_memory_limit || PISTON_CONFIG.MEMORY_LIMIT_KB,
        args: config.args || [],
        mainFileName: config.mainFileName || getFileName(config.language),
    };
}

const normalize = (s: unknown) =>
    typeof s === "string" ? s.replace(/\r\n/g, "\n").trimEnd() : s;


export async function judgeSingleCode(
    testCases: TestCase[],
    codeString: string,
    options: PistonOptions = {},
    config: TestConfig
): Promise<JudgeResult[]> {
    if (!Array.isArray(testCases) || testCases.length === 0) {
        throw new ErrorHandler(400, "testCases must be a non-empty array");
    }

    const pistonOptions = getDefaultPistonOptions(options);
    const files = [
        {
            name: pistonOptions.mainFileName as string,
            content: codeString,
        }
    ]

    const results: JudgeResult[] = [];
    for (const tc of testCases) {
        try {
            const res: any = await client.execute({
                ...pistonOptions,
                files,
                stdin: tc.input ?? "",
            });
            const stdout: string = (res?.run?.stdout ?? res?.stdout ?? "") as string;
            const stderr: string = (res?.run?.stderr ?? res?.stderr ?? "") as string;
            const exitCode: number | undefined = (res?.run?.code ?? res?.code) as
                | number
                | undefined;

            const isError = typeof exitCode === "number" && exitCode !== 0; messeage: string;

