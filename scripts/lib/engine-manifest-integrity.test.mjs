import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { matchesAny } from "./glob-match.mjs";
import { selectModulesToCheck } from "./health-activation.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-manifest integrity — a structural guard over the REAL repo-root
// engine-manifest.json. The manifest is the inventory of engine-owned files
// (ADR 0003/0012): `replace` (overwrite), `merge` (3-way base / provenance) and
// `regenerate` (generated launchers). A renamed source dir or skill that silently
// drops out of the inventory is a latent bug — `update-engine`'s apply plan and
// the installer's provenance seed both resolve these globs against real files, so
// a dead glob means a file with no provenance base (Phase 2 merge gap). This guard
// catches exactly that class: every NON-generated glob must match ≥1 tracked file.
// ═══════════════════════════════════════════════════════════════════════════

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifest = JSON.parse(readFileSync(join(repoRoot, "engine-manifest.json"), "utf8"));
const trackedFiles = execFileSync("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

// `regenerate` launchers and `.claude/settings.json` are GENERATED at install
// (from .template / by the launcher self-heal), never tracked source → excluded.
const GENERATED = new Set([".claude/settings.json"]);

// The regimes that actually WRITE a file into an upgrading brain. `merge` is absent on
// purpose: a script the brain runs must arrive whole, not 3-way merged.
const CARRY_GLOBS = [...(manifest.regimes.replace ?? []), ...(manifest.regimes.regenerate ?? [])];

// Which of `refs` no carry glob matches — i.e. which the brain is told to run but never
// receives. Shared by the two ways a brain comes to run an engine script: a wired hook,
// and a skill's instructions.
const notCarried = (refs) =>
  refs.filter((rel) => !CARRY_GLOBS.some((glob) => matchesAny([glob], rel)));

// Every `scripts/<name>.mjs` a file names, deduplicated and ordered.
const scriptsNamedIn = (files) => [
  ...new Set(
    files.flatMap(
      (file) => readFileSync(join(repoRoot, file), "utf8").match(/scripts\/[\w.-]+\.mjs/g) ?? [],
    ),
  ),
].sort();

test("engine-manifest — every `replace`/`merge` glob resolves to a real tracked file (no dead inventory entries)", () => {
  const globs = [...(manifest.regimes.replace ?? []), ...(manifest.regimes.merge ?? [])].filter(
    (glob) => !GENERATED.has(glob),
  );
  const dead = globs.filter((glob) => !trackedFiles.some((file) => matchesAny([glob], file)));
  assert.deepEqual(dead, [], `manifest globs matching no tracked file (renamed/removed?): ${dead.join(", ")}`);
});

// The reverse guard: an engine-owned script wired as a hook but ABSENT from the
// manifest is the "update-engine must self-carry its libs" bug class — the brain runs
// it, yet an upgrade never refreshes it (settings.json is sacred/merge, so the hook
// stays wired, pointing at a stale script). Every hook script must be carried
// (declared in replace/regenerate; merge would be wrong for these).
//
// Scoped to EVERY hook event, not just SessionStart: the guard was written when the
// template only wired SessionStart, so the day a `PreToolUse` entry landed it would
// have been waved through by a guard that looked like it covered hooks. The event a
// script is wired under says nothing about whether an upgrade owes it.
const templateHooks = () =>
  JSON.parse(readFileSync(join(repoRoot, ".claude", "settings.json.template"), "utf8")).hooks ?? {};

const wiredHookScripts = () => [
  ...new Set(
    Object.values(templateHooks())
      .flatMap((groups) => groups.flatMap((entry) => entry.hooks.map((h) => h.command)))
      .flatMap((cmd) => cmd.match(/scripts\/[\w.-]+\.mjs/g) ?? []),
  ),
];

test("engine-manifest — every hook script, under EVERY event, is in SOME regime (a wired script an upgrade never delivers reaches nobody)", () => {
  const allRegimes = Object.values(manifest.regimes ?? {}).flat();
  const undeclared = wiredHookScripts().filter(
    (rel) => !allRegimes.some((glob) => matchesAny([glob], rel)),
  );
  assert.deepEqual(
    undeclared,
    [],
    `hook scripts in no regime at all (the brain runs what an upgrade never sends): ${undeclared.join(", ")}`,
  );
});

// The stricter half, and the reason the guard above is not enough. A hook script under
// `merge` is only OFFERED as a diff (ADR 0012) — a brain that ever touched it keeps its own
// copy forever. That is a deliberate call for the two persistence hooks, whose commit/push
// policy the owner is invited to tune; it is the WRONG default for anything new, which is why
// the exception is a named list rather than a regime-wide allowance. A third name appearing
// here means someone chose "user-editable" for a hook — deliberately, or by copy-paste.
const USER_EDITABLE_HOOKS = ["scripts/auto-commit.mjs", "scripts/auto-push.mjs"];

test("engine-manifest — every hook script arrives WHOLE (replace/regenerate), bar the two persistence hooks the owner may tune", () => {
  const merged = wiredHookScripts().filter((rel) => notCarried([rel]).length > 0);

  assert.deepEqual(
    merged.sort(),
    [...USER_EDITABLE_HOOKS].sort(),
    "a hook script is carried by `merge` — an upgrade will only OFFER it, so a brain that edited it " +
      "keeps a stale copy for good. Put it in `replace` unless the owner is genuinely meant to fork it",
  );
});

// …and the scan must be reading real entries: a template whose events stopped matching
// (renamed key, restructured groups) would make the guard above pass on an empty list
// forever. Both the write-time guard and the persistence hook are wired under events
// OTHER than SessionStart, so their presence proves the sweep is not SessionStart-shaped.
test("engine-manifest — the hook sweep reads every event, so an empty scan cannot pass for a clean one", () => {
  const events = Object.keys(templateHooks());

  assert.ok(
    ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit"].every((e) => events.includes(e)),
    `the template lost a hook event the guard above relies on: ${events.join(", ")}`,
  );
});

// The same reverse guard, for the OTHER way a brain runs an engine script: a skill
// that tells it to. `engine-skills/**` is `replace`, so an upgrade always delivers the
// INSTRUCTION; if the script it names is in no regime, `computeApplyPlan` (a strict
// write-allowlist) never copies it, and the brain gets `Cannot find module` on the one
// path the skill calls mandatory. That is how `scripts/refresh-note.mjs` shipped to
// nobody while `engine-skills/consolidate/SKILL.md` shipped to everybody — masked by
// its helper `scripts/lib/note-refresh.mjs`, which `scripts/lib/**` did carry.
//
// Deliberately scoped to scripts a DELIVERED SKILL invokes, not "every script in
// scripts/": `clear-example-notes.mjs`, `pick-folder.mjs` and `run-eval.mjs` are
// install-time / maintainer-only on purpose, and no skill names them.
test("engine-manifest — every script a delivered skill invokes is itself carried to upgraders", () => {
  const skillFiles = trackedFiles.filter((file) => file.startsWith("engine-skills/"));

  const undeclared = notCarried(scriptsNamedIn(skillFiles));

  assert.deepEqual(
    undeclared,
    [],
    `scripts named by a delivered skill but carried by no regime — upgraders get the instruction and no script: ${undeclared.join(", ")}`,
  );
});

// The THIRD door onto an engine script, alongside a wired hook and a skill: the
// CONSTITUTION. Claude re-reads it every session, so a script it names is a script the
// brain will be told to run — `node scripts/rehydrate.mjs` on a second machine, `node
// scripts/clear-example-notes.mjs` to purge the demo notes. Named-but-not-carried is the
// same failure as for a skill, with a worse blast radius: the instruction is what an
// upgrade refreshes, so the brain is confidently told to run a file it never received (or
// keeps a copy stale since install — that is how the v3.4.1 Windows fix to
// `clear-example-notes.mjs` reached nobody who installed before it).
// Scoped to the DELIVERED constitution (the two layers, every locale); the repo-root
// CLAUDE.md is the launcher's install stub, addressed to a session that has no brain yet.
test("engine-manifest — every script the delivered constitution names is itself carried to upgraders", () => {
  const constitutions = trackedFiles.filter((file) =>
    /(^|\/)CLAUDE\.(engine\.md|md\.template)$/.test(file),
  );

  const undeclared = notCarried(scriptsNamedIn(constitutions));

  assert.deepEqual(
    undeclared,
    [],
    `scripts named by the constitution but carried by no regime — the brain is told to run what it never got: ${undeclared.join(", ")}`,
  );
});

// F-B2 (ADR 0026): settings.json.template must be CARRIED to upgraders (declared in
// `replace`). It is the desired-state SOURCE the hook reconcile / SessionStart bootstrap
// tick reads to detect drift — a brain comparing its settings.json against its OWN STALE
// template would see no gap and never wire the v3.3.0 runtime hooks. (The generated
// settings.json itself stays SACRED/merge; only its engine-owned template is shipped.)
test("engine-manifest — settings.json.template is carried to upgraders (the hook-reconcile desired-state source)", () => {
  const carried = (manifest.regimes.replace ?? []).some((glob) =>
    matchesAny([glob], ".claude/settings.json.template"),
  );
  assert.ok(
    carried,
    "`.claude/settings.json.template` must be in `replace` so upgraders get the new SessionStart entries (F-B2 bootstrap)",
  );
});

// The health-check activation policy (ADR 0030, F7-bis) reads engineModuleRequirements ×
// the brain's .mcp.json. vault-rag is the brain's load-bearing module: if it ever silently
// loses its `mandatory` tag, a vault-rag absent from .mcp.json would no longer be flagged
// broken (it'd default to optional → skipped). Lock the real manifest against that drift.
test("engine-manifest — vault-rag is tagged mandatory, so an absent vault-rag is flagged broken", () => {
  const verdict = selectModulesToCheck({ manifest, isRegistered: () => false });
  assert.ok(
    verdict.brokenMissing.includes("vault-rag"),
    "vault-rag must be mandatory: an unregistered vault-rag has to surface as broken, not be skipped",
  );
});

// The manifest's `indexSchemaVersion` is what `reindex-trigger.mjs` compares (target vs the
// brain's) to decide whether an upgrade owes a reindex. The RAG's own INDEX_SCHEMA_VERSION is
// what the runtime gate compares (stamped vs current) to refuse a search on a stale index. When
// the two drift apart, `update-engine` neither reindexes nor warns, and the owner meets the
// staleness as a REFUSAL TO ANSWER their first question after upgrading. That is exactly how the
// 1 → 2 bump shipped unannounced for a whole release. This guard makes the drift impossible.
test("engine-manifest — indexSchemaVersion matches the RAG's INDEX_SCHEMA_VERSION (an upgrade must know the reindex it owes)", () => {
  const vectorStore = readFileSync(join(repoRoot, "rag", "src", "lib", "vector-store.ts"), "utf8");
  const declared = vectorStore.match(/INDEX_SCHEMA_VERSION\s*=\s*(\d+)/)?.[1];
  assert.equal(
    manifest.indexSchemaVersion,
    Number(declared),
    "the manifest must declare the index schema the engine actually writes; a manifest left behind " +
      "makes update-engine skip the reindex it owes, and the first search after upgrading refuses to answer",
  );
});

// Pre-ship belt (Thomas, 2026-06-21): the rig repoints a DISPOSABLE brain's manifest
// `source` at a LOCAL bare repo + a branch ref (e.g. /Users/…/qa-v33-src.git) so
// /update-engine pulls the not-yet-pushed work. That QA pointer must NEVER leak into the
// COMMITTED launcher manifest: a generated brain derives its source from the launcher's
// `git remote get-url origin` at install time (installer.mjs), so the launcher manifest
// must carry NO `source` at all. A committed `source` — especially a local filesystem path
// or a non-GitHub ref — would make a shipped brain try to pull from a repo that only exists
// on the maintainer's machine. This guard fails loud if that QA trace is ever committed.
test("engine-manifest — the committed launcher manifest pins NO `source` (no QA repo/ref leak)", () => {
  assert.equal(
    manifest.source,
    undefined,
    "the launcher manifest must not pin a `source`; the installer injects the GitHub origin per-brain. " +
      "A committed source is almost certainly a leaked QA repoint (local bare repo / branch ref) — remove it.",
  );
});

// F1 — the counterpart of the guard above. The brain records WHERE it pulls from once,
// at install, and revises it never: a repository rename therefore reaches no deployed
// brain, and the whole fleet updates through a redirect in a namespace we no longer own.
// `canonicalRepo` is how the launcher states its own address so brains converge on it
// (update-engine.mjs, step 7). Blank it and every brain silently keeps its install-day
// name forever — a silence this guard turns into a red suite. It must also be an
// ANONYMOUS https clone URL: a brain updates on machines with no deploy key (ssh://,
// git@) and a local path is the QA-repoint leak the guard above already refuses.
test("engine-manifest — the launcher declares its own canonical repo URL, anonymously clone-able", () => {
  assert.match(
    manifest.canonicalRepo ?? "",
    /^https:\/\/[^\s]+\.git$/,
    "the launcher must declare `canonicalRepo` as an https .git URL — it is the only way a repository " +
      "rename ever reaches an already-installed brain (F1), and ssh/local forms exclude keyless machines",
  );
});

// The FOURTH door onto an engine script, and until F3 nobody was watching it: an
// engine script that SPAWNS another one. The three guards above see a hook command,
// a skill's instructions and the constitution's prose — all of which name their
// script as `scripts/<name>.mjs`. A spawn does not: it computes the path
// (`join(__dirname, "health-probe-run.mjs")`), so the sibling is invisible to every
// text scan, and an uncarried child would fail with `Cannot find module` inside a
// DETACHED background process — i.e. with no error anyone ever sees, the session
// line simply saying "checking…" forever.
const SPAWN_RE = /join\(__dirname,\s*((?:"[^"]+"\s*,\s*)*"[\w.-]+\.mjs")\s*\)/g;

const spawnedScriptsIn = (files) => [
  ...new Set(
    files.flatMap((file) =>
      [...readFileSync(join(repoRoot, file), "utf8").matchAll(SPAWN_RE)].map(
        (m) => "scripts/" + [...m[1].matchAll(/"([^"]+)"/g)].map((s) => s[1]).join("/"),
      ),
    ),
  ),
].sort();

test("engine-manifest — every script an engine script SPAWNS is itself carried (a detached child fails silently)", () => {
  const carriedScripts = trackedFiles.filter(
    (file) => file.startsWith("scripts/") && file.endsWith(".mjs") && !file.endsWith(".test.mjs"),
  );

  const spawned = spawnedScriptsIn(carriedScripts);
  assert.ok(
    spawned.includes("scripts/lib/reconcile-brain.mjs") && spawned.includes("scripts/health-probe-run.mjs"),
    `the spawn scan found nothing it should have (${spawned.join(", ")}) — an empty scan reads green forever`,
  );

  assert.deepEqual(
    notCarried(spawned),
    [],
    "a script an engine script spawns, carried by no regime: the parent arrives, the child never does",
  );
});
