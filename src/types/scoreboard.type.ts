import { PistonSubtaskReply } from "./judger.type.js";
import { StatusCode } from "piston-judger";



export interface ScoreBoardFormat {
  [subtaskIndex: string]: {
    hidden: TestCaseRecord[];
    visible: TestCaseRecord[];
  };
}

export interface ScoreResultFormat {
  [problemID: string]: PistonSubtaskReply[];
}

export interface TestCaseRecord {
  status: StatusCode;
  userOutput: string;
  expectedOutput: string;
  time: string;
}

export interface ClientTestCaseRecord {
  statusCode: StatusCode;
  input: string;
  expectingOutput: string;
  userOutput: string;
  time: string;
}

export interface ClientResultFormat {
  [problemID: string]: {
    hidden: ClientTestCaseRecord[];
    visible: ClientTestCaseRecord[];
  }[];
}