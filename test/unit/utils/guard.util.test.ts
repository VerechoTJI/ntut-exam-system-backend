import { describe, it, expect } from "vitest";
import { sanitizeStudentID } from "../../../src/utils/guard.util";

describe("Guard Util - Unit Tests", () => {
  describe("sanitizeStudentID", () => {
    it("應該保留合法的學號格式（字母、數字、底線、連字號）", () => {
      const validID = "A12345678";
      expect(sanitizeStudentID(validID)).toBe(validID);
    });

    it("應該保留包含底線和連字號的學號", () => {
      const idWithSpecialChars = "A123_456-78";
      expect(sanitizeStudentID(idWithSpecialChars)).toBe(idWithSpecialChars);
    });

    it("應該移除特殊符號", () => {
      const idWithSymbols = "A123!@#$456";
      expect(sanitizeStudentID(idWithSymbols)).toBe("A123456");
    });

    it("應該移除空格", () => {
      const idWithSpaces = "A123 456 78";
      expect(sanitizeStudentID(idWithSpaces)).toBe("A12345678");
    });

    it("應該移除中文字符", () => {
      const idWithChinese = "A123學生456";
      expect(sanitizeStudentID(idWithChinese)).toBe("A123456");
    });

    it("應該處理空字串", () => {
      expect(sanitizeStudentID("")).toBe("");
    });

    it("應該移除所有非法字符，只保留合法字符", () => {
      const complexID = "A12<script>alert('xss')</script>345";
      expect(sanitizeStudentID(complexID)).toBe("A12scriptalertxssscript345");
    });

    it("應該保留大小寫字母", () => {
      const mixedCase = "AbCdEf123";
      expect(sanitizeStudentID(mixedCase)).toBe(mixedCase);
    });
  });
});
