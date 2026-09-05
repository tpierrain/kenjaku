// Does the hook still honour its barrier when the payload reaches stdin LATE?
// The harness pipes the payload; nothing promises it lands before the hook reads fd 0.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, cpSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO = "/Users/tpierrain/Dev/kenjaku";
const delayMs = Number(process.argv[2] ?? 0);

const brain = realpathSync(mkdtempSync(join(tmpdir(), "probe-")));
cpSync(join(REPO, "scripts"), join(brain, "scripts"), { recursive: true });
for (const d of [".vault-rag", ".claude", ".cache"]) mkdirSync(join(brain, d), { recursive: true });
writeFileSync(join(brain, ".vault-rag", "universes.json"), JSON.stringify({ universes: ["acme", "blue-team"] }));
writeFileSync(join(brain, ".vault-rag", "active-universe"), "acme");
writeFileSync(join(brain, ".claude", "settings.json"), JSON.stringify({
  hooks: { SessionStart: [{ hooks: [{ command: `node "${brain}/scripts/session-status.mjs"` }] }] },
}));
const marker = join(brain, ".cache", "startup-sync.json");
writeFileSync(marker, JSON.stringify({ sessionId: "s-race", phase: "running", at: Date.now() }));

const started = Date.now();
const child = spawn(process.execPath, [join(brain, "scripts", "session-universe.mjs")], { stdio: ["pipe", "pipe", "pipe"] });
let stdout = "";
child.stdout.on("data", (c) => (stdout += c));
const closed = new Promise((r) => child.on("close", r));

// The ONLY difference from the suite's test: the payload is handed over late.
setTimeout(() => child.stdin.end(JSON.stringify({ session_id: "s-race", source: "startup" })), delayMs);

setTimeout(() => {
  writeFileSync(join(brain, ".vault-rag", "active-universe"), "blue-team");
  writeFileSync(marker, JSON.stringify({ sessionId: "s-race", phase: "done", at: Date.now() }));
}, delayMs + 250);

await closed;
const saw = /Active universe: '([a-z-]+)'/.exec(stdout)?.[1] ?? "(nothing)";
console.log(`stdin delayed ${String(delayMs).padStart(4)}ms → announced '${saw}' after ${Date.now() - started}ms  ${saw === "blue-team" ? "✅ barrier held" : "❌ BARRIER SKIPPED"}`);
rmSync(brain, { recursive: true, force: true });
