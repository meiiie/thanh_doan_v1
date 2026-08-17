import { spawn } from "node:child_process";
import { resolve } from "node:path";

const command = process.argv[2];
const extraArguments = process.argv.slice(3);
if (!new Set(["dev", "build", "start"]).has(command)) {
  console.error("Usage: node scripts/run-vinext.mjs <dev|build|start> [...arguments]");
  process.exit(2);
}

const child = spawn(
  process.execPath,
  [resolve("node_modules/vinext/dist/cli.js"), command, ...extraArguments],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal && process.platform !== "win32") process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
