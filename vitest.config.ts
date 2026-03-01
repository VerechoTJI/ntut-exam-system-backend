import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node", // 測這種 service / schema 用 node 環境就好
    globals: true, // 這樣可以直接用 describe/it/expect，而不用每次都 import
    globalSetup: ["./test/setup/global-setup.ts"],
    setupFiles: [], // 可以在這裡添加測試前的全域設定
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/types/**",
        "**/*.type.ts",
        "**/*.config.ts",
        "src/config/swagger.ts", // Swagger 配置不需要測試
      ],
    },
    testTimeout: 30000, // 集成測試可能需要較長時間
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
});
