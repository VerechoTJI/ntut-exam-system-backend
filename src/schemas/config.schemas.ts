import { z } from "zod";
import CONFIG, { LanguageKey } from "../constants/piston.config.js";

const supportedLanguages = Object.keys(CONFIG.languages) as [
  LanguageKey,
  ...LanguageKey[],
];

const languageSchema = z.enum(supportedLanguages);

// 單一測資的格式
const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

// 子任務 (subtask) 的格式
const subtaskSchema = z.object({
  title: z.string(),
  visible: z.array(testCaseSchema),
  hidden: z.array(testCaseSchema),
});

// 每一題 (puzzle) 的格式
const puzzleSchema = z.object({
  title: z.string(),
  language: languageSchema,
  timeLimit: z.number().optional(), // 只有某些題目有，故設為 optional
  memoryLimit: z.number().optional(), // 同上
  subtasks: z.array(subtaskSchema),
});

// 可以存取考試的使用者
const accessUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// 整體 midterm_test_config.json 的 schema
export const examConfigSchema = z.object({
  testTitle: z.string(),
  description: z.string(),
  judgerSettings: z.object({
    timeLimit: z.number(),
    memoryLimit: z.number(),
  }),
  accessableUsers: z.array(accessUserSchema),
  puzzles: z.array(puzzleSchema),
});

// 對應的 TypeScript 型別
export type ExamConfig = z.infer<typeof examConfigSchema>;
export type Puzzle = z.infer<typeof puzzleSchema>;
export type SubTask = z.infer<typeof subtaskSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
export type AccessUser = z.infer<typeof accessUserSchema>;
