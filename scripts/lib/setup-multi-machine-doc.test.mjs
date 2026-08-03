import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ═══════════════════════════════════════════════════════════════════════════
// SETUP.md, the multi-machine promise (F14) — a doc guard, because here the DOC is
// the defect: it told a second machine to clone, `cd rag && npm install`, and that
// there was "no need for the installer", while the clone has neither `.mcp.json` nor
// `.claude/settings.json` (both gitignored, both baking absolute paths) — so the brain
// came up with no `vault-rag`, no hooks and half its dependencies. And the escape hatch
// it offered for exactly that symptom, "re-run `node installer.mjs`", CANNOT run: the
// installer refuses an existing folder, on purpose. `scripts/rehydrate.mjs` is the real
// answer; these guards keep the prose pointing at it.
// ═══════════════════════════════════════════════════════════════════════════

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const setup = readFileSync(join(repoRoot, "SETUP.md"), "utf8");

// The text of one `## <n>. …` section, up to the next `## ` heading.
const section = (heading) => {
  const start = setup.indexOf(heading);
  assert.notEqual(start, -1, `SETUP.md no longer has a section starting with "${heading}"`);
  const rest = setup.slice(start + heading.length);
  const end = rest.indexOf("\n## ");
  return heading + (end === -1 ? rest : rest.slice(0, end));
};

test("SETUP.md — the multi-machine section hands the second machine the rehydrate command", () => {
  assert.match(
    section("## 7. Backup & multi-machine portability"),
    /node scripts\/rehydrate\.mjs/,
    "§7 is the one place a second-machine user reads before their first session: it must name " +
      "`node scripts/rehydrate.mjs`, or the clone stays wired to nothing",
  );
});

test("SETUP.md — no remedy tells the owner to re-run the installer against a brain that exists", () => {
  const impossible = setup
    .split("\n")
    .filter((line) => /re-run/i.test(line) && /installer\.mjs/.test(line));
  assert.deepEqual(
    impossible,
    [],
    "`installer.mjs` refuses an existing folder (non-zero exit, nothing modified), so telling an " +
      `owner to re-run it is a dead end — point at \`node scripts/rehydrate.mjs\` instead:\n${impossible.join("\n")}`,
  );
});
