/**
 * Render start wrapper — reads PORT from the environment explicitly.
 * Avoids npm/shell quirks with ${PORT:-3000} in package.json scripts.
 */
const { spawn } = require("node:child_process");

const port = process.env.PORT || "3000";
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["next", "start", "--hostname", "0.0.0.0", "--port", String(port)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[start-render] next start terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("[start-render] failed to launch next start:", error);
  process.exit(1);
});
