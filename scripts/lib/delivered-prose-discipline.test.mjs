import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, posix } from "node:path";
import { execFileSync } from "node:child_process";

import { parseLsFilesZ, filterCopyable } from "./tracked-files.mjs";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// DELIVERED PROSE — the surface the brain obeys and no net was watching.
//
// Measured, not assumed (triage plan § H, 2026-08-22): nine mutations were applied
// to delivered Markdown on disk and the whole suite run against each. Three files
// could be **gutted down to a single line with 2 525 tests green**: `CONNECTORS.md`
// (in no manifest regime at all), `.claude/skills/EXAMPLES.md`, and
// `engine-skills/mcp-token-expired/SKILL.md`. They are instructions an owner's brain
// follows, with neither a doc guard nor a byte tripwire behind them. The merge-regime
// files are covered by accident — any byte change makes `engine-fingerprints.json`
// stale and the suite red — and `replace` files get nothing at all.
//
// 🛑 WHAT THIS GUARD DOES NOT DO, said here because the same measurement proved it.
// A doctrine sentence was INVERTED in place ("is not ambience: it is the statement of
// the task" → "is usually just ambience") leaving every asserted keyword where it was,
// and not one doc guard fired. No pattern here can see meaning either. So the rules
// below lean on what a keyword cannot fake:
//
//   • CONTRACTS the loader actually reads (a skill's `name` is what routing matches);
//   • RELATIONS between two shipped artefacts (a doc that promises a skill, and the
//     skill's directory; a documented default, and the constant that implements it;
//     a link, and the file it points at) — a lie in one of those is a lie the other
//     half contradicts, which is a thing a test CAN judge;
//   • ORDER and PLACEMENT, which is what caused the 2026-08-08 field defect and what
//     the good doc guards in this folder already assert.
//
// The gutting floor is deliberately low: it catches deletion, never degradation.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const exists = (rel) => existsSync(join(REPO_ROOT, rel));

// Where skills live BEFORE they are delivered. `engine-skills/**` is installed into
// `.claude/skills/<name>/` in the brain; `templates/fr/**` is the same surface in the
// other locale, overlaid at install. All three carry the same frontmatter contract.
const SKILL_ROOTS = [".claude/skills", "engine-skills", "templates/fr/.claude/skills"];

function deliveredSkills() {
  const found = [];
  for (const root of SKILL_ROOTS) {
    if (!exists(root)) continue;
    for (const name of readdirSync(join(REPO_ROOT, root))) {
      const rel = `${root}/${name}/SKILL.md`;
      if (statSync(join(REPO_ROOT, root, name)).isDirectory() && exists(rel)) found.push({ name, rel });
    }
  }
  return found;
}

function frontmatter(text) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!block) return null;
  // The quotes around a YAML value are the syntax, not the value: `description:
  // "Alias of /switch"` must read back as `Alias of /switch`, or every rule below is
  // matching one character to the right of where the prose starts.
  const field = (key) =>
    (new RegExp(`^${key}:\\s*(.+)$`, "m").exec(block[1])?.[1] ?? "").trim().replace(/^"(.*)"$/s, "$1");
  return { name: field("name"), description: field("description"), version: field("version"), body: text.slice(block[0].length) };
}

// ── 1. The frontmatter is a CONTRACT, and it is what a gutted skill loses first ──
//
// `name` is what the router matches when someone types `/switch`; `description` is the
// only thing the model reads to decide whether a skill applies at all. A skill whose
// name drifts from its directory does not fail loudly — it simply never triggers, and
// the owner concludes the brain "forgot" how to do something.
test("delivered prose: every shipped skill declares the name the router matches", () => {
  const skills = deliveredSkills();
  assert.ok(skills.length >= 15, `the sweep must actually find the skills (found ${skills.length})`);

  const broken = [];
  for (const { name, rel } of skills) {
    const fm = frontmatter(read(rel));
    if (!fm) broken.push(`${rel}: no frontmatter block at all`);
    else if (fm.name !== name) broken.push(`${rel}: declares name '${fm.name}', lives in '${name}'`);
    else if (fm.description === "") broken.push(`${rel}: no description — the model has nothing to trigger on`);
    else if (!/^\d+\.\d+\.\d+$/.test(fm.version)) broken.push(`${rel}: version '${fm.version}' is not a semver`);
  }
  assert.deepEqual(broken, []);
});

test("delivered prose: no shipped skill is an empty shell", () => {
  // The floor, and it is honest about its reach: it catches a file that was emptied,
  // never one that was weakened. Two of the shipped skills are six-line aliases, so
  // the bar is what even THEY clear — a title and something under it.
  const thin = [];
  for (const { rel } of deliveredSkills()) {
    const body = frontmatter(read(rel))?.body ?? "";
    const lines = body.split("\n").filter((l) => l.trim() !== "");
    if (!/^# /m.test(body) || lines.length < 4) thin.push(`${rel}: ${lines.length} non-empty lines`);
  }
  assert.deepEqual(thin, []);
});

test("delivered prose: an ALIAS skill points at a skill that exists, and says so in its body", () => {
  // `/univers` and `/universe` exist only to forward to `/switch`. If the target is
  // renamed and the aliases are not, both commands answer with a pointer to nothing —
  // the one failure an alias can have, and it is silent.
  const dangling = [];
  for (const { rel } of deliveredSkills()) {
    const fm = frontmatter(read(rel));
    const target = /^Alias (?:of|de) \/([a-z-]+)/i.exec(fm?.description ?? "")?.[1];
    if (!target) continue;
    if (!deliveredSkills().some((s) => s.name === target)) dangling.push(`${rel}: forwards to /${target}, which ships nowhere`);
    if (!fm.body.includes(`\`${target}\``)) dangling.push(`${rel}: never names ${target} in its body, so the model has no gesture to make`);
  }
  assert.deepEqual(dangling, []);
  assert.ok(
    deliveredSkills().some(({ rel }) => /^Alias (?:of|de) \//i.test(frontmatter(read(rel))?.description ?? "")),
    "the premise: at least one alias skill ships, or this test is asserting over an empty list",
  );
});

// ── 2. `.claude/skills/EXAMPLES.md` — a menu that promises what is on the shelf ──
//
// This file tells an owner which skills their brain already has and how to write their
// own. Both halves can go quietly false: a skill it announces as shipped can be retired
// (v5 retires `tdd-discipline`), and the anatomy it teaches can drift from the contract
// the loader enforces — which would have owners writing skills that never trigger.
const EXAMPLES = [".claude/skills/EXAMPLES.md", "templates/fr/.claude/skills/EXAMPLES.md"];

test("delivered prose: EXAMPLES.md only calls 'shipped' the skills that actually ship", () => {
  const lies = [];
  for (const rel of EXAMPLES) {
    const text = read(rel);
    const claimed = [...text.matchAll(/\*\*([a-z0-9-]+)\*\*\s*✅/g)].map((m) => m[1]);
    assert.ok(claimed.length >= 2, `${rel}: the table must still mark shipped skills (found ${claimed.length})`);
    for (const name of claimed) {
      if (!exists(`${dirname(rel)}/${name}/SKILL.md`)) lies.push(`${rel}: announces '${name}' as shipped, and it is not there`);
    }
  }
  assert.deepEqual(lies, []);
});

test("delivered prose: the skill anatomy EXAMPLES.md teaches satisfies the contract it is teaching", () => {
  // The relation that makes this more than a keyword check: the sample frontmatter is
  // run through the SAME parser as every shipped skill above. Drop `version` from the
  // sample, or rename its `description` key, and an owner following the page to the
  // letter writes a skill their brain will not load.
  for (const rel of EXAMPLES) {
    const sample = /```markdown\r?\n([\s\S]*?)```/.exec(read(rel));
    assert.ok(sample, `${rel}: the anatomy block is the page's operative half — it must be there`);
    const fm = frontmatter(sample[1]);
    assert.ok(fm, `${rel}: the sample must carry a real frontmatter block`);
    assert.notEqual(fm.name, "", `${rel}: the sample must show 'name', which is what routing matches`);
    assert.notEqual(fm.description, "", `${rel}: the sample must show 'description', which is what triggers it`);
    assert.match(fm.version, /^\d+\.\d+\.\d+$/, `${rel}: the sample must show a semver version`);
  }
});

// ── 3. `CONNECTORS.md` — the one delivered file in NO regime at all ─────────────
//
// It is copied into every brain and covered by nothing: no doc guard, and no
// fingerprint row to go stale. What it documents is verifiable against the code that
// implements it, so that is what is asserted rather than its wording.
test("delivered prose: every env var CONNECTORS.md documents exists in .env.example", () => {
  const documented = [...new Set([...read("CONNECTORS.md").matchAll(/`([A-Z][A-Z0-9_]{3,})`/g)].map((m) => m[1]))];
  assert.ok(documented.length >= 1, "the premise: the page documents at least one setting");
  const env = read(".env.example");
  assert.deepEqual(
    documented.filter((name) => !new RegExp(`^#?\\s*${name}=`, "m").test(env)),
    [],
    "a setting an owner is told to use, that their .env never mentions, is a dead instruction",
  );
});

test("delivered prose: the auto-sync cadence CONNECTORS.md promises is the one the server implements", () => {
  // Two artefacts, one number. The doc says "default 300"; the server resolves the
  // cadence from a constant. Change the constant alone and every brain is told a
  // figure that stopped being true — the exact shape of drift no keyword can catch.
  const implemented = /const DEFAULT_INTERVAL_SECONDS = (\d+);/.exec(read("local-mirror/src/lib/sync-interval.ts"))?.[1];
  assert.ok(implemented, "the server's default must stay readable as a named constant, or this relation cannot be checked");
  const mirrors = docSection(read("CONNECTORS.md"), /^## 🪞 Local mirrors/m);
  assert.match(
    mirrors,
    new RegExp(`\\*\\*default ${implemented}\\*\\*`),
    `CONNECTORS.md must promise the implemented default (${implemented} s)`,
  );
  assert.match(mirrors, /`0` = off/, "and the way to turn it off, which is the only other value with a behaviour");
});

test("delivered prose: CONNECTORS.md keeps a mirror distinct from a connector, and in that order", () => {
  // The distinction the page exists to make: a connector reaches OUT, a mirror pulls IN.
  // An owner who reads them as the same thing wires the wrong one and waits for notes
  // that never arrive. Placement is asserted with it — the menu of connectors has to
  // come before the mirror section that defines itself against it.
  const text = read("CONNECTORS.md");
  const menu = text.search(/^## Menu — which connector for which need/m);
  const mirrors = text.search(/^## 🪞 Local mirrors/m);
  assert.ok(menu > -1 && mirrors > menu, "the connector menu must come before the local-mirror section that contrasts with it");
  assert.match(docSection(text, /^## 🪞 Local mirrors/m), /\*\*mirrors\*\* a chosen zone of an\s+internal tool \*\*into your vault\*\*/);
  assert.match(docSection(text, /^## 🪞 Local mirrors/m), /token lives only in `\.env`\*\*, never in the chat/);
});

test("delivered prose: every file CONNECTORS.md links to is a file a BRAIN actually has", () => {
  // Found by writing this guard: the page linked twice into `maintainers/`, which
  // `filterCopyable` excludes from every generated brain. Both links rendered as dead
  // ends for every owner who followed them, and nothing in the suite could say so.
  const delivered = new Set(filterCopyable(parseLsFilesZ(execFileSync("git", ["ls-files", "-z"], { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 1e8 }))));
  const dead = [];
  for (const [, link] of read("CONNECTORS.md").matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    const target = posix.normalize(link.split("#")[0]).replace(/\/$/, "");
    if (target === "" || target === ".") continue;
    if (!delivered.has(target) && ![...delivered].some((f) => f.startsWith(`${target}/`))) dead.push(link);
  }
  assert.deepEqual(dead, [], "a link an owner cannot follow is worse than no link: it says the brain is missing something");
});

// ── 4. `engine-skills/mcp-token-expired/SKILL.md` — a procedure whose ORDER is the fix ──
//
// This skill runs at the worst possible moment: a connector has just failed mid-answer.
// Its two load-bearing properties are both about sequence. The exception (a connector
// blocked by org policy) must be met BEFORE the alert, or an owner is told to reconnect
// something no reconnection can fix, on every single call. And `/mcp` must be tried
// before Disconnect/Reconnect, because one takes twenty seconds and the other takes a
// browser round-trip — an order established in the field, not in theory.
const TOKEN_SKILL = "engine-skills/mcp-token-expired/SKILL.md";

test("delivered prose: the expired-token skill meets the by-design exception BEFORE it alerts", () => {
  const text = read(TOKEN_SKILL);
  const exception = text.search(/^## ⚠️ Exception: a connector that is unavailable by design/m);
  const procedure = text.search(/^## Procedure \(real authentication error\)/m);
  assert.ok(exception > -1, "the exception section must exist");
  assert.ok(procedure > exception, "…and it must come first, or the alert fires on connectors no token can fix");
  assert.match(docSection(text, /^## ⚠️ Exception/m), /do NOT show the alert below and do NOT run the reconnection/);
  assert.match(docSection(text, /^## ⚠️ Exception/m), /continue without blocking/);
});

test("delivered prose: the expired-token skill keeps its cheap remedy before its expensive one", () => {
  const procedure = docSection(read(TOKEN_SKILL), /^## Procedure \(real authentication error\)/m);
  const mcpFirst = procedure.search(/Push `\/mcp` in the terminal as the first attempt/);
  const reconnect = procedure.search(/\*\*Real fix: `Disconnect` then `Reconnect`/);
  assert.ok(mcpFirst > -1 && reconnect > mcpFirst, "/mcp is tried first; Disconnect/Reconnect is the answer to it not working");
  // The step that keeps the owner's actual question moving. Without it the skill is a
  // procedure for fixing a connector, in the middle of someone asking about something else.
  assert.match(procedure, /Continue with the fallback\*\* without blocking/);
  // And the alert an owner sees is the whole point of the skill being visual at all.
  assert.match(procedure, /🚨🚨🚨 MCP TOKEN EXPIRED 🚨🚨🚨/);
  assert.match(procedure, /TO RECONNECT: type {2}\/mcp {2}→ select <connector> → Re-authenticate/);
});

test("delivered prose: the expired-token skill still says Claude cannot do the handshake itself", () => {
  // The line that stops the model from promising a reconnection it structurally cannot
  // perform — an interactive OAuth flow it has no way to trigger.
  assert.match(
    docSection(read(TOKEN_SKILL), /^## Pitfalls ruled out in practice/m),
    /Claude \*\*cannot\*\* trigger the OAuth handshake itself/,
  );
});
