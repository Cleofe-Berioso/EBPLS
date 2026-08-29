import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));
const whiteboxOut = path.join(__dirname, "..", "whitebox");

/**
 * White-box suite — sources in EBPLS, reports under ../whitebox.
 */
export default defineConfig({
  resolve: {
    alias: { "@": srcPath },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: [path.join(__dirname, "vitest.whitebox.setup.ts")],
    include: [
      "src/lib/__tests__/whitebox/**/*.test.ts",
      "src/lib/__tests__/*.test.ts",
    ],
    reporters: [
      "default",
      ["json", { outputFile: path.join(whiteboxOut, "evidence", "vitest-results.json") }],
      ["junit", { outputFile: path.join(whiteboxOut, "evidence", "vitest-junit.xml") }],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      reportsDirectory: path.join(whiteboxOut, "coverage"),
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/__tests__/**",
        "src/lib/prisma.ts",
        "**/*.d.ts",
      ],
    },
  },
});
