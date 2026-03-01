import { describe, it, expect } from "vitest";
import { getZipFilePath } from "../../../src/utils/file-operator.util";
import path from "path";

describe("File Operator Util - Unit Tests", () => {
  describe("getZipFilePath", () => {
    it("應該生成正確的 zip 檔案路徑", () => {
      const studentID = "A12345678";
      const result = getZipFilePath(studentID);

      expect(result).toContain("upload");
      expect(result).toContain(`${studentID}.zip`);
      expect(result).toMatch(/upload\/A12345678\.zip$/);
    });

    it("應該使用 POSIX 格式路徑（使用正斜線）", () => {
      const studentID = "B98765432";
      const result = getZipFilePath(studentID);

      // 確保路徑使用 / 而不是 \
      expect(result).not.toContain("\\");
      expect(result.split(path.sep).join("/")).toBe(result);
    });

    it("應該處理包含特殊字符的學號", () => {
      const studentID = "A123-456_78";
      const result = getZipFilePath(studentID);

      expect(result).toContain("A123-456_78.zip");
    });

    it("應該為不同學號生成不同的路徑", () => {
      const studentID1 = "A111111111";
      const studentID2 = "B222222222";

      const path1 = getZipFilePath(studentID1);
      const path2 = getZipFilePath(studentID2);

      expect(path1).not.toBe(path2);
      expect(path1).toContain("A111111111.zip");
      expect(path2).toContain("B222222222.zip");
    });

    it("應該包含 upload 目錄", () => {
      const studentID = "TestStudent";
      const result = getZipFilePath(studentID);

      expect(result).toContain("upload");
    });
  });
});
