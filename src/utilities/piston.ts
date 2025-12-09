import axios from 'axios';

const get = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message || 'GET request failed' };
  }
};

const post = async (url, data) => {
  try {
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message || 'POST request failed' };
  }
};

const or = (a, b) => (a !== undefined && a !== null) ? a : b;



export interface PistonClient {
  runtimes(): Promise<Result | Runtime[]>;

  execute(language: string, code: string, options?: ExecutionOptions): Promise<Result | ExecutionResult>;
}


export interface ExecutionResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: any;
    output: string
  }
}

interface ExecutionOptions {
  language: string;
  version: string;
  files: {
    name: string;
    content: string;
  }[]
  stdin: string;
  args: string[];
  compile_timeout: number;
  run_timeout: number;
  compile_memory_limit: number;
  run_memory_limit: number;
}

export interface Runtime {
  language: string;
  version: string;
  aliases: string[]
}

export type Result = any | { error: any, success: boolean } | undefined;

const defaultServer = "https://emkc.org";

export const piston = (opts: any = {}) => {
  const server = String(opts.server || defaultServer).replace(/\/$/, '');
  const store: { runtimes?: Runtime[] } = {};

  const api = {

    async runtimes() {
      if (store.runtimes) {
        return store.runtimes;
      }
      const suffix = (server === defaultServer)
        ? '/api/v2/piston/runtimes'
        : '/api/v2/runtimes';
      const url = `${server}${suffix}`;
      const runtimes = await get(url);
      if (runtimes && runtimes.success !== false) {
        store.runtimes = runtimes;
      }
      return runtimes;
    },

    async execute(argA: any, argB?: any, argC?: any): Promise<Result | ExecutionResult> {
      const runtimes = await api.runtimes();
      if (runtimes.success === false) {
        return runtimes;
      }

      const config = typeof argA === 'object' ? argA : typeof argB === 'object' ? argB : argC || {};
      let language = (typeof argA === 'string') ? argA : undefined;
      language = language || config.language;
      const code = typeof argB === 'string' ? argB : undefined;
      const latestVersion = (runtimes.filter(n => n.language === language).sort((a, b) => {
        return a.version > b.version ? -1 : b.version > a.version ? 1 : 0;
      })[0] || {}).version;

      const boilerplate = {
        "language": language,
        "version": config.version || latestVersion,
        "files": or(config.files, [{
          "content": code
        }]),
        "stdin": or(config.stdin, ""),
        "args": or(config.args, ["1", "2", "3"]),
        "compile_timeout": or(config.compileTimeout, 10000),
        "run_timeout": or(config.runTimeout, 3000),
        "compile_memory_limit": or(config.compileMemoryLimit, -1),
        "run_memory_limit": or(config.runMemoryLimit, -1)
      }

      const suffix = (server === defaultServer)
        ? '/api/v2/piston/execute'
        : '/api/v2/execute';
      const url = `${server}${suffix}`;
      return await post(url, boilerplate);
    }
  }

  return api;
}

export default piston;