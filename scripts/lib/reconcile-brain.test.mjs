import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

// The standing surface F1 is about, read off the real brain the reconcile just wrote:
// asserting through it (rather than through the manifest's digests) is what pins the
// SENTENCE the owner would have read, not merely the bookkeeping behind it.
import { readEngineDivergence } from "./engine-base-fs.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// reconcile-brain — the RECONCILE half of update-engine, extracted (ADR 0026).
//
// `reconcileBrain()` makes the brain's on-disk engine state MATCH a desired-state
// manifest (`target`) by copying engine files, install-if-absent engine skills,
// reconciling .mcp.json, regenerating launchers, running install + (conditional)
// reindex — WITHOUT ever touching the vault, .env, constitution, settings or any
// non-declared / custom skill (the write-allowlist safety core). It takes a
// `sourceDir` (the files to converge FROM) and the four I/O seams, so it runs
// offline and deterministically. It does NOT fetch and does NOT record the engine
// version — those are update-engine's fetch-result concerns (step 7).
//
// Network / npm / reindex / launcher-regeneration are SEAMS injected by the test.
// ═══════════════════════════════════════════════════════════════════════════

async function loadReconciler() {
  return (await import("./reconcile-brain.mjs")).reconcileBrain;
}

async function loadCli() {
  return (await import("./reconcile-brain.mjs")).runReconcileCli;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

// The expectation side of the {{PROJECT_ROOT}} normalisation: a no-op on POSIX, the real
// contract on win32 (where the temp brain dir carries backslashes).
const toPosixPath = (p) => p.split("\\").join("/");

// The sacred files the reconciler must never touch (write-allowlist safety core).
const SACRED = {
  "CLAUDE.md": "# My personalized constitution\nI tailored this. Do not touch.\n",
  ".env": "GOOGLE_GEMINI_API_KEY=super-secret-do-not-leak\nEMBED_BATCH=4\n",
  ".claude/settings.json": '{\n  "mine": true\n}\n',
  ".claude/skills/zzz-mine/SKILL.md": "---\nname: zzz-mine\n---\nMy home-made skill.\n",
  "vault/my-note.md": "# Mollecuisse\nThe canary that must never be lost.\n",
};

function manifest({ ragVersion = "1.1.0", indexSchemaVersion = 1, extraMerge = [], extraReplace = [], engineMcpServers = ["vault-rag"], retired = [] } = {}) {
  return {
    manifestVersion: 1,
    // S6c — a SIBLING of `regimes`, not one of them: it does not say how a shipped file
    // is updated, it says the engine no longer ships it. Empty on every manifest the
    // product has shipped so far, which is exactly the state most of this suite runs in.
    retired,
    engineVersion: { rag: ragVersion, constitutionTemplate: "1.0.0", scripts: "1.0.0" },
    indexSchemaVersion,
    regimes: {
      // ⚠️ `scripts/update-engine.mjs` sits in `replace`, where every one of the 48
      // shipped manifests has always put it. This fixture used to declare it `merge`,
      // and that single wrong line was the whole evidence behind a claim copied into a
      // plan, a comment and a test title (see engine-apply-plan.mjs's header).
      replace: ["rag/src/**", "rag/package.json", "scripts/update-engine.mjs", ...extraReplace],
      regenerate: ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"],
      merge: [".claude/skills/zzz-mine/**", ...extraMerge],
    },
    engineMcpServers,
    source: { repo: "https://example.test/launcher.git", ref: "v1.1.0" },
    provenance: {},
  };
}

// A brain at vA: a real engine file + the user's sacred files (no manifest needed —
// the reconciler receives `target` and `local` as objects).
function buildBrain() {
  const dir = mkdtempSync(join(tmpdir(), "sbg-recon-brain-"));
  writeFile(dir, "rag/src/index.ts", "// engine vA\n");
  writeFile(dir, "rag/package.json", '{ "name": "rag", "engineTag": "vA" }\n');
  for (const [rel, content] of Object.entries(SACRED)) writeFile(dir, rel, content);
  return dir;
}

// A fetched source at vB carrying the new engine files (+ optionally a new skill).
function buildSource() {
  const dir = mkdtempSync(join(tmpdir(), "sbg-recon-source-"));
  writeFile(dir, "rag/src/index.ts", "// engine vB\n");
  writeFile(dir, "rag/package.json", '{ "name": "rag", "engineTag": "vB" }\n');
  return dir;
}

// Inject all four I/O seams; record their side effects. regenerateLaunchers writes
// the launcher files (mirrors the real builder) so existence can be asserted.
// `countVaultNotes` returns a DISTINCTIVE count (not 0) and records the brainDir it was
// handed: a stub that returns 0 and ignores its argument cannot tell a wired seam from an
// unwired one — the reconciler could call the real counter, or call it with no brain at
// all, and every assertion would still hold.
const STUB_VAULT_NOTES = 407;

function seams() {
  const calls = { install: [], reindex: [], reindexMode: [], regenerate: [], count: [] };
  return {
    calls,
    regenerateLaunchers: async ({ brainDir, platform }) => {
      calls.regenerate.push(platform);
      for (const rel of ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"]) {
        writeFile(brainDir, rel, `# regenerated ${rel} (${platform})\n`);
      }
    },
    runInstall: async ({ ragDir }) => calls.install.push(ragDir),
    runReindex: async ({ brainDir, mode = "full" }) => {
      calls.reindex.push(brainDir);
      calls.reindexMode.push(mode);
    },
    countVaultNotes: async ({ brainDir }) => {
      calls.count.push(brainDir);
      return STUB_VAULT_NOTES;
    },
  };
}

function assertSacredUntouched(brainDir, before) {
  for (const rel of Object.keys(SACRED)) {
    assert.equal(
      sha256(join(brainDir, rel)),
      before[rel],
      `SACRED file changed — ${rel} must be byte-identical after a reconcile`,
    );
  }
}

// ── Test 1: the converge core — copy engine files, install a missing engine skill,
//    regenerate launchers, and report what it did, leaving sacred files untouched.
test("reconcileBrain — copies engine files, installs a missing engine skill, regenerates launchers", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // The source carries a NEW engine MERGE skill the brain lacks, declared engine-owned
  // (the merge install-if-absent mechanism, illustrated by `coach` now that local-mirror
  // relocated to the staged `engine-skills/` path — F-B7 2b).
  const skillBody = "---\nname: coach\n---\nYour sparring partner.\n";
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", skillBody);
  const target = manifest({ extraMerge: [".claude/skills/coach/**"] });
  const local = manifest({ ragVersion: "1.0.0" }); // same schema → no reindex
  const before = {};
  for (const rel of Object.keys(SACRED)) before[rel] = sha256(join(brainDir, rel));

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  // Engine file swapped to vB.
  assert.equal(readFileSync(join(brainDir, "rag/src/index.ts"), "utf8"), "// engine vB\n");
  // Missing engine skill installed from the source, and named in the report.
  assert.equal(readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"), skillBody);
  assert.deepEqual(report.installedSkills, ["coach"]);
  // …and it is reported as INSTALLED, never as "brought up to date". Since Step 8.5's F2
  // the refresh pass ALSO delivers an absent file (`absent-install`), so a broken
  // install-if-absent would still put the bytes on disk — under the wrong headline, and
  // stripped of its new-capability status (no restart counter, no "run once more").
  assert.deepEqual(report.skillsRefreshed, [], "a skill that was ABSENT is installed, not refreshed");
  // Launchers regenerated once for this platform.
  assert.deepEqual(calls.regenerate, ["posix"]);
  assert.ok(existsSync(join(brainDir, "rag/launch.sh")));
  // npm install ran in the brain's rag/.
  assert.deepEqual(calls.install, [join(brainDir, "rag")]);
  // Same index schema → no reindex.
  assert.deepEqual(calls.reindex, []);
  assert.equal(report.reindexed, false);
  // Survival guarantee: not one sacred byte changed.
  assertSacredUntouched(brainDir, before);
});

// ── Test 2: IDEMPOTENCE — the property ADR 0026 hinges on (auto-finalize +
//    SessionStart self-heal run the reconciler repeatedly). A second reconcile over an
//    already-converged brain installs no skill, registers no MCP server, and leaves the
//    just-installed skill byte-identical → zero churn / no auto-commit noise.
test("reconcileBrain — a second run over a converged brain is a true no-op (zero churn)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", "---\nname: coach\n---\nYour sparring partner.\n");
  // A brain .mcp.json with only vault-rag; the source template adds local-mirror.
  writeFile(brainDir, ".mcp.json", JSON.stringify({ mcpServers: { "vault-rag": { type: "stdio" } } }, null, 2));
  writeFile(
    sourceDir,
    ".mcp.json.template",
    JSON.stringify(
      {
        mcpServers: {
          "vault-rag": { type: "stdio", cwd: "{{PROJECT_ROOT}}" },
          "local-mirror": { type: "stdio", cwd: "{{PROJECT_ROOT}}" },
        },
      },
      null,
      2,
    ),
  );
  const target = manifest({
    extraMerge: [".claude/skills/coach/**"],
    engineMcpServers: ["vault-rag", "local-mirror"],
  });
  const local = manifest({ ragVersion: "1.0.0" });
  const s1 = seams();
  const first = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s1 });
  // First run did the work: installed the skill + registered the server.
  assert.deepEqual(first.installedSkills, ["coach"]);
  assert.deepEqual(first.mcpServersAdded, ["local-mirror"]);

  const skillHash = sha256(join(brainDir, ".claude/skills/coach/SKILL.md"));
  const mcpHash = sha256(join(brainDir, ".mcp.json"));

  const s2 = seams();
  const second = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s2 });

  // Second run: nothing new installed or registered.
  assert.deepEqual(second.installedSkills, [], "an already-present engine skill is not reinstalled");
  assert.deepEqual(second.mcpServersAdded, [], "an already-registered MCP server is not re-added");
  // No churn: the skill file and .mcp.json are byte-identical to after the first run.
  assert.equal(sha256(join(brainDir, ".claude/skills/coach/SKILL.md")), skillHash, "skill must not churn");
  assert.equal(sha256(join(brainDir, ".mcp.json")), mcpHash, ".mcp.json must not churn on a converged brain");
});

// ── Test 3: triangulate the reindex branch — when the index schema MOVES, the
//    reconciler runs the reindex seam and reports it (test 1 covered the unchanged case).
test("reconcileBrain — index schema moved → reindex runs and is reported", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const target = manifest({ indexSchemaVersion: 2 }); // brain at schema 1 → moves to 2
  const local = manifest({ ragVersion: "1.0.0", indexSchemaVersion: 1 });

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.deepEqual(calls.reindex, [brainDir], "schema moved → reindex must run once in the brain");
  assert.deepEqual(calls.reindexMode, ["full"], "a schema move re-encodes every note → FULL reindex");
  assert.equal(report.reindexed, true);
  // The REASON is user-facing (update-engine's report says whether every note was
  // re-encoded or not), so it is asserted by value, not merely as "truthy".
  assert.equal(report.reindexReason, "schema");
});

// ── Test 4: THE EXTENSIBILITY INVARIANT (the project's promise — users may grow
//    their harness). A user's CUSTOM (non-declared) skill, their own MCP server, and
//    any directory/file they added are NEVER perturbed by a reconcile — even when the
//    same reconcile installs a brand-new ENGINE skill + server. Run TWICE to also cover
//    the auto-finalize child (same code path): both extensions survive byte-identical
//    AND the engine still does its additive job. If a future change ever broke the
//    write-allowlist for user territory, this fails fail-first.
test("reconcileBrain — never disturbs a user's custom skill / MCP server / added files, even while installing engine ones", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  // The user has grown their harness: a private skill, a personal MCP server, and a
  // top-level folder of their own — none of it declared by the engine manifest.
  const myskill = "---\nname: my-private\n---\nMy own private skill — hands off.\n";
  writeFile(brainDir, ".claude/skills/my-private/SKILL.md", myskill);
  writeFile(brainDir, "my-research/2026-notes.md", "# my own folder\nNot an engine path.\n");
  writeFile(
    brainDir,
    ".mcp.json",
    JSON.stringify({ mcpServers: { "vault-rag": { type: "stdio" }, "my-tool": { type: "stdio", command: "node" } } }, null, 2),
  );

  // The fetched engine ships a NEW engine skill + declares both engine MCP servers.
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", "---\nname: coach\n---\nYour sparring partner.\n");
  writeFile(
    sourceDir,
    ".mcp.json.template",
    JSON.stringify(
      { mcpServers: { "vault-rag": { type: "stdio", cwd: "{{PROJECT_ROOT}}" }, "local-mirror": { type: "stdio", cwd: "{{PROJECT_ROOT}}" } } },
      null,
      2,
    ),
  );
  const target = manifest({
    extraMerge: [".claude/skills/coach/**"],
    engineMcpServers: ["vault-rag", "local-mirror"],
  });
  const local = manifest({ ragVersion: "1.0.0" });

  const myskillHash = sha256(join(brainDir, ".claude/skills/my-private/SKILL.md"));
  const myfolderHash = sha256(join(brainDir, "my-research/2026-notes.md"));

  // Run the reconciler TWICE (parent + auto-finalize child are the same code path).
  let installed;
  for (const pass of [1, 2]) {
    const { ...s } = seams();
    const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });
    if (pass === 1) installed = report;
  }

  // The engine DID its additive job (pass 1 installed the new engine skill + server)…
  assert.deepEqual(installed.installedSkills, ["coach"], "the engine skill is still installed");
  assert.deepEqual(installed.mcpServersAdded, ["local-mirror"], "the engine MCP server is still registered");
  assert.ok(existsSync(join(brainDir, ".claude/skills/coach/SKILL.md")));

  // …WITHOUT ever perturbing the user's territory, across both passes.
  assert.equal(sha256(join(brainDir, ".claude/skills/my-private/SKILL.md")), myskillHash, "a custom skill must stay byte-identical");
  assert.equal(sha256(join(brainDir, "my-research/2026-notes.md")), myfolderHash, "a user-added folder must be untouched");
  const mcp = JSON.parse(readFileSync(join(brainDir, ".mcp.json"), "utf8"));
  assert.ok(mcp.mcpServers["my-tool"], "a user-added MCP server must be preserved");
  assert.equal(mcp.mcpServers["my-tool"].command, "node", "the user's MCP server definition must be intact");
});

// ── Test 5: the CLI entry the auto-finalize child process runs (ADR 0026). It parses
//    --brainDir/--sourceDir, loads the brain's OWN (just-updated) manifest as both
//    target and local (so it converges from the fetched source with no reindex), and
//    reconciles with the real seams. Here the seams are stubbed; we assert it installed
//    the missing engine skill the brain manifest declares.
test("runReconcileCli — parses flags, loads the brain manifest, and converges from the source", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // The source carries a new engine skill; the brain's manifest declares it engine-owned.
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", "---\nname: coach\n---\nYour sparring partner.\n");
  writeFile(brainDir, "engine-manifest.json", JSON.stringify(manifest({ extraMerge: [".claude/skills/coach/**"] }), null, 2));

  const { calls, ...s } = seams();
  const runReconcileCli = await loadCli();
  const report = await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: s,
  });

  assert.equal(existsSync(join(brainDir, ".claude/skills/coach/SKILL.md")), true, "the child installs the missing engine skill");
  assert.deepEqual(report.installedSkills, ["coach"]);
  // target = local = the brain's own manifest → schema unchanged → no reindex in the child.
  assert.deepEqual(calls.reindex, [], "the auto-finalize child must not reindex (it converges, it does not migrate)");
});

// ── Test 6: SessionStart self-heal mode — sourceDir === brainDir (ADR 0026, Layer B).
//    The brain converges from its OWN on-disk code (no fetch, no network). The reconciler
//    must NEVER copy an engine file onto itself: on Linux `copyFileSync(f, f)` truncates
//    the destination before copying (a real cross-platform footgun, ADR 0015) → it would
//    zero the engine. The self-copy guard makes this a TRUE no-op: nothing is reported as
//    copied and the present engine file stays byte-identical. (Deterministic, OS-independent:
//    asserts the guard via `report.copied`, not via the platform's self-copy behaviour.)
test("reconcileBrain — self-heal mode (sourceDir === brainDir) copies nothing onto itself, engine files preserved", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const engineHash = sha256(join(brainDir, "rag/src/index.ts"));
  const target = manifest({ ragVersion: "1.0.0" });
  const local = manifest({ ragVersion: "1.0.0" }); // same schema → no reindex

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir: brainDir, target, local, ...s });

  assert.deepEqual(report.copied, [], "no engine file may be copied onto itself (Linux would truncate it)");
  assert.equal(sha256(join(brainDir, "rag/src/index.ts")), engineHash, "the present engine file must stay byte-identical");
});

// The single, nominative vault carve-out (ADR 0026 amended): the ONLY vault path the
// reconciler may ever write — write-if-absent — seeded from the NON-sacred staged copy
// the engine DELIVERS (F-B7b), so it converges in BOTH update and self-heal modes.
const HEALTH_NOTE = "vault/engine-health/health-check.md";
const STAGED_HEALTH_NOTE = "engine-health/health-check.md";

// ── Test 7: UPGRADERS get the canary (ADR 0026, decision B). At a REAL update
//    (sourceDir !== brainDir), if the engine-owned health-check note is absent from the
//    brain, the reconciler SEEDS it from the source (write-if-absent) and runs a paired
//    incremental reindex — even though the index schema did NOT move — so the freshly
//    seeded note is findable (no false `broken`). Without this, an upgrader's vault never
//    receives the dedicated note (vault is sacred + v3.3.0 forces no reindex).
test("reconcileBrain — seeds the engine-health note on an upgrader (absent) and reindexes it", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const noteBody = "---\ntitle: Engine health check\n---\nQuibblethorne canary — engine-owned.\n";
  writeFile(sourceDir, STAGED_HEALTH_NOTE, noteBody);
  // Same index schema → needsReindex is false; any reindex here is the seed's pairing.
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" });

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  // The note now lives in the brain, byte-identical to the source.
  assert.equal(readFileSync(join(brainDir, HEALTH_NOTE), "utf8"), noteBody, "the health-check note must be seeded");
  // The paired incremental reindex ran so the note is findable — no false `broken`.
  assert.deepEqual(calls.reindex, [brainDir], "seeding the note must trigger a paired reindex");
  assert.deepEqual(calls.reindexMode, ["incremental"], "the seed pairing is INCREMENTAL (only the one note), never a full re-encode");
  assert.equal(report.reindexed, true);
  // The two reasons must stay DISTINGUISHABLE: the schema case re-encodes the whole
  // vault, this one does not, and the report tells the user which of the two happened.
  assert.equal(report.reindexReason, "health-note-seed");
});

// ── Test 8: WRITE-IF-ABSENT + the index is its own membership oracle (ADR 0026,
//    decision B + finding #6). Once the health-check note is present, a later update-time
//    reconcile must NEVER re-write it (write-if-absent, a user may have edited it). It DOES
//    re-pair a cheap INCREMENTAL reindex though: keying the index pass off the note's
//    on-disk PRESENCE (not a one-shot "just copied" flag) is what makes a seeded-but-
//    unindexed note — left by a prior update that crashed before indexing — self-heal on
//    the next run, with no durable false `broken`. The incremental pass skips every
//    already-indexed note via its content-hash cache, so this is a fast no-op, never a
//    full re-encode of the user's notes.
test("reconcileBrain — never re-writes an existing health note, but re-pairs a cheap incremental reindex", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(sourceDir, STAGED_HEALTH_NOTE, "---\ntitle: src\n---\nQuibblethorne (source copy).\n");
  // The brain already carries its OWN health note (a user could even have edited it).
  writeFile(brainDir, HEALTH_NOTE, "---\ntitle: mine\n---\nQuibblethorne (brain copy, kept).\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" }); // same schema → only the incremental health pairing
  const noteHash = sha256(join(brainDir, HEALTH_NOTE));

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(sha256(join(brainDir, HEALTH_NOTE)), noteHash, "an existing health note must never be overwritten");
  assert.deepEqual(calls.reindexMode, ["incremental"], "an upgrader's present health note re-pairs a CHEAP incremental pass, never a full re-encode");
  assert.equal(report.reindexed, true);
});

// ── Test 9: the carve-out is SCOPED to a single path (ADR 0026, decision B safety
//    invariant: "one path only"). Even when the source's vault carries other notes, the
//    reconciler seeds ONLY vault/engine-health/health-check.md — never any user note.
test("reconcileBrain — seeds ONLY the engine-health path, never another vault note", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(sourceDir, STAGED_HEALTH_NOTE, "---\ntitle: health\n---\nQuibblethorne.\n");
  // A decoy "user" note sitting in the source vault — must NOT be copied into the brain.
  writeFile(sourceDir, "vault/some-demo-note.md", "# A note that is NOT the engine canary\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" });

  const { ...s } = seams();
  await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.ok(existsSync(join(brainDir, HEALTH_NOTE)), "the engine-health note is seeded");
  assert.equal(
    existsSync(join(brainDir, "vault/some-demo-note.md")),
    false,
    "no other vault note may be seeded — the carve-out is one path only",
  );
});

// ── Test 10: self-heal mode (sourceDir === brainDir) SEEDS from the brain's OWN staged
//    copy (F-B7b). The pre-3.3.0 upgrader's old in-process update never seeds the note and
//    has no auto-finalize → convergence falls to the restart's self-heal, which runs with
//    sourceDir === brainDir. Because the note's source ships at the NON-sacred staged path
//    `engine-health/health-check.md` (delivered onto the brain's disk), self-heal CAN seed
//    the vault note (src `engine-health/…` ≠ dest `vault/engine-health/…`, no self-copy),
//    pairing a cheap incremental reindex so the canary is findable.
test("reconcileBrain — self-heal mode seeds the vault note from the brain's own staged copy (F-B7b)", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  // The update delivered the staged note onto the brain's disk (non-sacred `replace`); the
  // restart's self-heal (sourceDir === brainDir) must STILL seed the vault from it.
  const noteBody = "---\ntitle: Engine health check\n---\nQuibblethorne canary.\n";
  writeFile(brainDir, STAGED_HEALTH_NOTE, noteBody);
  const target = manifest({ ragVersion: "1.0.0" });
  const local = manifest({ ragVersion: "1.0.0" });

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir: brainDir, target, local, ...s });

  assert.equal(readFileSync(join(brainDir, HEALTH_NOTE), "utf8"), noteBody, "self-heal must seed the vault note from the brain's own staged copy");
  assert.deepEqual(calls.reindexMode, ["incremental"], "the self-heal seed pairs a cheap incremental reindex");
  assert.equal(report.reindexed, true);
});

// ── Test 10b: self-heal with NOTHING staged seeds nothing (safety). A brain with no staged
//    note and no vault note stays untouched — no phantom note, no needless reindex.
test("reconcileBrain — self-heal with no staged note seeds nothing, no reindex", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const target = manifest({ ragVersion: "1.0.0" });
  const local = manifest({ ragVersion: "1.0.0" });

  const { calls, ...s } = seams();
  await reconcile({ brainDir, platform: "posix", sourceDir: brainDir, target, local, ...s });

  assert.equal(existsSync(join(brainDir, HEALTH_NOTE)), false, "nothing staged → nothing seeded");
  assert.deepEqual(calls.reindex, [], "nothing seeded → no reindex");
});

// ── Test 11: finding #6 — a seeded-but-unindexed note can NEVER become a permanent
//    false `broken`. The seed (2.quater) precedes runInstall/runReindex; if either throws
//    AFTER the note was copied (a flaky npm install in the fresh update process, an ABI
//    hiccup), the note is on disk but was never indexed. The reconciler must key its index
//    pass off the note's ON-DISK PRESENCE so a RETRY re-pairs the (incremental) reindex and
//    the canary becomes findable — not off a one-shot "did I just copy it" flag that the
//    retry can never re-arm. RED before the fix: run 2 sees the note present, does NOT
//    reindex, and the canary stays invisible forever.
test("reconcileBrain — a note seeded by an update that then crashed pre-index is reindexed on the retry (#6)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(sourceDir, STAGED_HEALTH_NOTE, "---\ntitle: health\n---\nQuibblethorne — engine-owned.\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" }); // same schema → no schema-driven reindex

  // Run 1: the note is seeded, then the fresh process's npm install throws → the whole
  // reconcile rejects AFTER the note already landed on disk (the partial-failure window).
  const s1 = seams();
  s1.runInstall = async () => {
    throw new Error("npm install failed in the fresh update process (flaky network)");
  };
  await assert.rejects(
    reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s1 }),
    /npm install failed/,
    "run 1 must surface the install failure (fail-loud in the reconciler)",
  );
  assert.ok(existsSync(join(brainDir, HEALTH_NOTE)), "the note was seeded before the crash — it is on disk, unindexed");
  assert.deepEqual(s1.calls.reindex, [], "run 1 crashed before the reindex → the note is NOT indexed yet");

  // Run 2 (the user re-runs update-engine as instructed): the note is present-but-unindexed.
  // The reconciler must STILL reindex it (incremental) so it becomes findable.
  const s2 = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s2 });

  assert.deepEqual(s2.calls.reindex, [brainDir], "the retry must reindex the present-but-unindexed note");
  assert.deepEqual(s2.calls.reindexMode, ["incremental"], "the retry's pairing is incremental (only the one note)");
  assert.equal(report.reindexed, true, "the canary can never stay a permanent false `broken`");
});

// The engine's SessionStart quartet, as it lives in settings.json.template (placeholders intact).
function templateSessionStart() {
  return {
    hooks: {
      PostToolUse: [
        { matcher: "Write|Edit", hooks: [{ type: "command", command: '{{NODE}} "{{PROJECT_ROOT}}/scripts/auto-commit.mjs"', timeout: 30000 }] },
      ],
      SessionStart: ["session-self-heal", "session-health", "session-obsidian-hint", "session-status"].map((s) => ({
        matcher: "",
        hooks: [{ type: "command", command: `{{NODE}} "{{PROJECT_ROOT}}/scripts/${s}.mjs"`, timeout: 20000 }],
      })),
    },
  };
}

// A v3.1.0-origin brain settings.json: SessionStart wires session-status ONLY (the 3
// runtime hooks added after v3.1.0 are missing), with concrete already-substituted paths.
function v310Settings(brainDir) {
  return {
    mine: true, // a user-owned key the reconcile must preserve
    hooks: {
      PostToolUse: [
        { matcher: "Write|Edit", hooks: [{ type: "command", command: `/usr/local/bin/node "${brainDir}/scripts/auto-commit.mjs"`, timeout: 30000 }] },
      ],
      SessionStart: [
        { matcher: "", hooks: [{ type: "command", command: `/usr/local/bin/node "${brainDir}/scripts/session-status.mjs"`, timeout: 20000 }] },
      ],
    },
  };
}

// ── Test 12: F-B2 — the engine-owned SessionStart hooks must reach UPGRADERS.
//    settings.json is SACRED to the write-allowlist, but the reconciler additively merges
//    engine-owned hook entries from settings.json.template (the THIRD additive surface,
//    twin of the .mcp.json reconcile). A v3.1.0 brain wired session-status only → after a
//    real update it gains session-self-heal / session-health / session-obsidian-hint, with
//    the brain's OWN node interpreter + dir substituted, the user's `mine` key and existing
//    hook entries untouched, and `hooksAdded` reported.
test("reconcileBrain — wires the missing engine SessionStart hooks into settings.json (F-B2)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(v310Settings(brainDir), null, 2) + "\n");
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" });

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.deepEqual(
    report.hooksAdded.sort(),
    ["scripts/session-health.mjs", "scripts/session-obsidian-hint.mjs", "scripts/session-self-heal.mjs"],
    "the 3 runtime hooks missing on a v3.1.0 brain must be reported as wired",
  );
  const settings = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  const cmds = settings.hooks.SessionStart.flatMap((g) => g.hooks.map((h) => h.command));
  // Appended hooks substitute {{PROJECT_ROOT}}, which the engine emits POSIX-normalised
  // (cf. reconcile-brain.mjs / installer toPosix). On Windows brainDir has backslashes, so
  // the expectation must normalise too — a no-op on POSIX, the real contract on win32.
  const root = brainDir.split("\\").join("/");
  assert.ok(cmds.includes(`/usr/local/bin/node "${root}/scripts/session-self-heal.mjs"`), "self-heal wired with the brain's node + dir");
  assert.ok(cmds.includes(`/usr/local/bin/node "${root}/scripts/session-health.mjs"`), "session-health wired");
  assert.ok(cmds.includes(`/usr/local/bin/node "${root}/scripts/session-obsidian-hint.mjs"`), "session-obsidian-hint wired");
  assert.equal(settings.mine, true, "a user-owned settings key must be preserved");
  assert.equal(settings.hooks.SessionStart[0].hooks[0].command, `/usr/local/bin/node "${brainDir}/scripts/session-status.mjs"`, "the existing session-status entry stays first, untouched");
  // settings.json is SACRED and git-committed: when the reconciler does write it, it
  // writes a well-formed text file (final newline included), not a stripped blob.
  const rawSettings = readFileSync(join(brainDir, ".claude/settings.json"), "utf8");
  assert.equal(rawSettings, JSON.stringify(settings, null, 2) + "\n");
  assert.equal("statusLine" in settings, false, "a brain with no statusLine must not acquire an empty one");
});

// ── Test 13: idempotence + A2 invariant — a SECOND reconcile over a converged brain wires
//    nothing AND leaves settings.json byte-identical (no auto-commit churn). settings.json is
//    written ONLY when a hook is actually added.
test("reconcileBrain — a converged brain's settings.json is left byte-identical (no hook churn)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(v310Settings(brainDir), null, 2) + "\n");
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" });

  const s1 = seams();
  const first = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s1 });
  assert.equal(first.hooksAdded.length, 3, "first run wires the 3 missing hooks");
  const settingsHash = sha256(join(brainDir, ".claude/settings.json"));

  const s2 = seams();
  const second = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s2 });
  assert.deepEqual(second.hooksAdded, [], "a converged brain wires nothing");
  assert.equal(sha256(join(brainDir, ".claude/settings.json")), settingsHash, "settings.json must be byte-identical on the 2nd run (no churn)");
});

// Test 13's fixture is written EXACTLY as the reconciler would serialise it, so a
// reconciler that rewrote settings.json unconditionally would still leave it
// byte-identical — the no-churn guard was self-confirming. Here the very same converged
// brain stores its settings NON-canonically (the shape a human editor leaves: 4-space
// indent, no final newline). Now "written only when something is actually added" is a
// claim the bytes can refute. This matters: settings.json is SACRED, and a silent
// reformat of the user's own file at every session start is exactly the churn ADR 0026
// forbids.
test("reconcileBrain — a converged brain's HAND-FORMATTED settings.json is not even reformatted", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" });

  // First converge normally, then re-store the SAME settings hand-formatted.
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(v310Settings(brainDir), null, 2) + "\n");
  await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });
  const settingsPath = join(brainDir, ".claude/settings.json");
  const handFormatted = JSON.stringify(JSON.parse(readFileSync(settingsPath, "utf8")), null, 4); // 4 spaces, no final newline
  writeFileSync(settingsPath, handFormatted);

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.deepEqual(report.hooksAdded, []);
  assert.deepEqual(report.hooksRepaired, []);
  assert.equal(readFileSync(settingsPath, "utf8"), handFormatted, "nothing to add → settings.json must not be touched AT ALL");
});

// ═══════════════════════════════════════════════════════════════════════════
// F1 (v5.0.0 code review) — THE ENGINE'S OWN WRITE MUST NOT READ AS THE OWNER'S.
//
// Step 2.quinquies is the one write the reconciler ever makes to `.claude/settings.json`,
// and this release adds TWO hook entries to the template — so every brain in the fleet
// takes that write on the update itself. The file is in `regimes.merge`, and NOTHING
// else re-seeds it: its recorded digest stayed at the pre-update bytes, so from the very
// next session start `engineDivergence` reported it held back by the owner, at every
// session, forever, and undismissibly (no refresh family writes a `.new` beside it).
//
// The repair is the obvious one, said once: the record moves with the bytes. What is NOT
// obvious — and is what these two tests separate — is that it must move ONLY when the
// engine actually wrote. A blanket re-seed would silence a real owner edit and turn the
// whole surface into a file that always agrees with itself.
// ═══════════════════════════════════════════════════════════════════════════

// A brain that is genuinely CONVERGED on its merge files: every one of them on disk
// matches its recorded digest, so the divergence report starts empty and any entry
// appearing later is something this pass caused.
function convergedManifest(brainDir, { extraMerge = [] } = {}) {
  const m = manifest({ extraMerge: [".claude/settings.json", ...extraMerge] });
  const recorded = [".claude/settings.json", ".claude/skills/zzz-mine/SKILL.md"];
  m.provenance = Object.fromEntries(
    recorded.map((rel) => [rel, base(readFileSync(join(brainDir, rel), "utf8"))]),
  );
  m.baseRefs = Object.fromEntries(recorded.map((rel) => [rel, "v1.1.0"]));
  return m;
}

test("runReconcileCli — a brain the ENGINE just wired holds nothing back (F1)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(v310Settings(brainDir), null, 2) + "\n");
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  writeFile(brainDir, "engine-manifest.json", JSON.stringify(convergedManifest(brainDir), null, 2));

  // ⚠️ The fixture must START converged, or the assertion at the end would hold for a
  // brain that never had anything to hold back in the first place.
  assert.deepEqual(
    readEngineDivergence({ brainDir }),
    [],
    "fixture check: this brain holds nothing back BEFORE the engine writes to it",
  );

  const { calls: _calls, ...s } = seams();
  const report = await reconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: s,
  });

  // …and the engine really did rewrite the file — without this the test would pass on a
  // reconciler that simply never touched settings.json.
  assert.equal(report.hooksAdded.length, 3, "the engine must have rewritten settings.json for this to prove anything");
  assert.deepEqual(
    readEngineDivergence({ brainDir }),
    [],
    "a file the ENGINE just rewrote may never be reported as one the OWNER is holding back",
  );
});

test("runReconcileCli — the owner's OWN edit to settings.json is still held back (the record moves only with the engine's write)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(v310Settings(brainDir), null, 2) + "\n");
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  writeFile(brainDir, "engine-manifest.json", JSON.stringify(convergedManifest(brainDir), null, 2));
  const argv = ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"];
  // First pass wires the hooks and re-records — the brain is now converged on the file.
  await reconcileCli({ argv, seams: seams() });

  // THEN the owner edits it themselves. The second pass has nothing to add, so it writes
  // nothing — and the edit must survive as a fact the brain still states.
  const settingsPath = join(brainDir, ".claude/settings.json");
  const mine = JSON.parse(readFileSync(settingsPath, "utf8"));
  mine.permissions = { allow: ["Bash(open:*)"] };
  writeFileSync(settingsPath, JSON.stringify(mine, null, 2) + "\n");

  const report = await reconcileCli({ argv, seams: seams() });

  assert.deepEqual(report.hooksAdded, [], "the second pass must have nothing to wire");
  assert.deepEqual(
    readEngineDivergence({ brainDir }).map((d) => d.rel),
    [".claude/settings.json"],
    "an edit the OWNER made is still theirs — the re-record may not be a blanket amnesty",
  );
});

// A deployed win32 brain whose hook commands are broken but which has NO statusLine and
// is missing no hook: the ONLY reason to write is the repair itself. Nothing else covered
// that term of the write guard in isolation — every other repair fixture also had a
// statusLine to heal, so a reconciler that ignored repairs alone would have stayed green
// and left the whole Windows fleet broken forever (the additive merge never rewrites an
// existing command, so the repair is these brains' only route back).
test("reconcileBrain (win32) — a repair with nothing added and no statusLine still writes", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const rootPosix = toPosixPath(brainDir);
  const { statusLine, ...noStatusLine } = brokenWin32Settings(rootPosix);
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(noStatusLine, null, 2) + "\n");
  writeFile(brainDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();

  const report = await reconcile({
    brainDir, platform: "win32", sourceDir: brainDir, target, local: target, ...seams(),
  });

  assert.deepEqual(report.hooksAdded, [], "the broken brain already wires every engine hook");
  // The WHOLE list, not `.includes`: a report that also claimed to have repaired a
  // statusLine this brain does not even have would be a lie the user acts on.
  assert.deepEqual(
    [...report.hooksRepaired].sort(),
    [
      "scripts/auto-commit.mjs",
      "scripts/auto-push.mjs",
      "scripts/session-health.mjs",
      "scripts/session-obsidian-hint.mjs",
      "scripts/session-self-heal.mjs",
      "scripts/session-status.mjs",
    ],
    "the repair itself is the only reason to write — and it reports exactly what it healed",
  );
  const settings = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  const cmds = Object.values(settings.hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
  for (const cmd of cmds) assert.doesNotMatch(cmd, /cmd \/c/i, "the healed commands must actually be on disk");
  assert.equal("statusLine" in settings, false, "a brain with no statusLine must not acquire an empty one");
});

// The mirror: ONLY the statusLine is ours to deal with. It is not a hook, it lives at the
// top level of settings.json, and since ADR 0036 it is REMOVED rather than repaired — so
// it still needs its own reason-to-write, and its own line in the report.
test("reconcileBrain (win32) — retiring our statusLine is reason enough to write, on its own", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const rootPosix = toPosixPath(brainDir);
  const healed = (script) => `${rootPosix}/scripts/run-node.cmd "${rootPosix}/scripts/${script}"`;
  const settingsIn = {
    mine: true,
    statusLine: { type: "command", command: brokenWin32Settings(rootPosix).statusLine.command }, // the ONLY broken thing
    hooks: {
      PostToolUse: [{ matcher: "Write|Edit", hooks: [{ type: "command", command: healed("auto-commit.mjs"), timeout: 30000 }] }],
      SessionStart: ["session-self-heal", "session-health", "session-obsidian-hint", "session-status"].map((s) => ({
        matcher: "", hooks: [{ type: "command", command: healed(`${s}.mjs`), timeout: 20000 }],
      })),
      Stop: [{ matcher: "", hooks: [{ type: "command", command: healed("auto-push.mjs"), timeout: 20000 }] }],
    },
  };
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(settingsIn, null, 2) + "\n");
  writeFile(brainDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();

  const report = await reconcile({
    brainDir, platform: "win32", sourceDir: brainDir, target, local: target, ...seams(),
  });

  assert.deepEqual(report.hooksAdded, []);
  assert.deepEqual(report.hooksRepaired, [], "nothing is repaired: the one broken thing is retired instead");
  assert.equal(report.statusLineRemoved, true, "and the retreat is reported on its own field");
  const settings = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  assert.equal("statusLine" in settings, false, "a broken line of ours is not worth healing — it is worth giving back");
  assert.equal(settings.mine, true, "the rest of the sacred file is untouched");
});

// A DEPLOYED Windows brain generated before the issue-#31 fix: every engine hook
// command (and the statusLine) baked the broken `cmd /c "<win-backslash>\run-node.cmd"`
// prefix that Git Bash eats. Uses win32 backslash paths, as the old installer rendered them.
function brokenWin32Settings(rootPosix) {
  const rootWin = rootPosix.split("/").join("\\");
  const broken = (script) => `cmd /c "${rootWin}\\scripts\\run-node.cmd" "${rootPosix}/scripts/${script}"`;
  return {
    mine: true,
    statusLine: { type: "command", command: broken("status-line.mjs") },
    hooks: {
      PostToolUse: [{ matcher: "Write|Edit", hooks: [{ type: "command", command: broken("auto-commit.mjs"), timeout: 30000 }] }],
      SessionStart: ["session-self-heal", "session-health", "session-obsidian-hint", "session-status"].map((s) => ({
        matcher: "", hooks: [{ type: "command", command: broken(`${s}.mjs`), timeout: 20000 }],
      })),
      Stop: [{ matcher: "", hooks: [{ type: "command", command: broken("auto-push.mjs"), timeout: 20000 }] }],
    },
  };
}

// ── Test 13.bis: issue #31 — a DEPLOYED win32 brain's broken `cmd /c "…\run-node.cmd"`
//    hook + statusLine commands are HEALED in place (self-heal reconcile). The additive
//    merge never rewrites an existing command, so without this repair those brains stay
//    broken forever. Idempotent: a second pass leaves settings.json byte-identical.
test("reconcileBrain (win32) — heals the issue-#31 broken hook commands in place, and retires our statusLine", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const rootPosix = brainDir.split("\\").join("/");
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(brokenWin32Settings(rootPosix), null, 2) + "\n");
  // self-heal mode: the brain reads its OWN template (sourceDir === brainDir).
  writeFile(brainDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" });

  const s1 = seams();
  const report = await reconcile({ brainDir, platform: "win32", sourceDir: brainDir, target, local, ...s1 });

  const settings = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  // ADR 0036: this brain's statusLine was OURS, so the same pass that heals the hooks
  // REMOVES it — there is nothing left to repair at the top level, and the owner's own
  // line runs again. Only the hook commands are healed in place.
  assert.equal("statusLine" in settings, false, "ours is removed, not repaired");
  assert.equal(report.statusLineRemoved, true);
  const allCmds = Object.values(settings.hooks).flatMap((groups) =>
    groups.flatMap((g) => g.hooks.map((h) => h.command)),
  );
  for (const cmd of allCmds) {
    assert.doesNotMatch(cmd, /cmd \/c/i, "no nested cmd /c must remain after the repair");
    assert.doesNotMatch(cmd, /\\/, "no backslash must remain (Git Bash would eat it)");
    assert.match(cmd, new RegExp(`^${rootPosix}/scripts/run-node\\.cmd `), "the fixed forward-slash run-node.cmd prefix");
  }
  // The whole list, in one assertion: the Stop hook is healed alongside the SessionStart
  // ones, and nothing else is claimed — `statusLine` is no longer among them, because it
  // is gone rather than fixed.
  assert.deepEqual(
    [...report.hooksRepaired].sort(),
    [
      "scripts/auto-commit.mjs",
      "scripts/auto-push.mjs",
      "scripts/session-health.mjs",
      "scripts/session-obsidian-hint.mjs",
      "scripts/session-self-heal.mjs",
      "scripts/session-status.mjs",
    ],
  );
  assert.equal(settings.mine, true, "a user-owned settings key survives the repair");

  // Idempotent: a second self-heal pass repairs nothing and leaves the file byte-identical.
  const hash = sha256(join(brainDir, ".claude/settings.json"));
  const second = await reconcile({ brainDir, platform: "win32", sourceDir: brainDir, target, local, ...seams() });
  assert.deepEqual(second.hooksRepaired, [], "a converged brain repairs nothing");
  assert.equal(second.statusLineRemoved, false, "and has nothing left to retreat from");
  assert.equal(sha256(join(brainDir, ".claude/settings.json")), hash, "no churn on the 2nd pass");
});

// ── Test 14: F-B7 2d — STAGED skills converge on upgraders. A new upgrader-bound
//    skill ships at the NON-sacred `engine-skills/<name>/` path (the sacred scrub forbids
//    delivering under `.claude/skills/`). reconcileBrain install-if-absent's it into
//    `.claude/skills/<name>/` ALONGSIDE the merge-skill install, and folds it into
//    `installedSkills`. This is how local-mirror reaches a pre-3.3.0 brain at restart.
test("reconcileBrain — installs a STAGED engine-skills/ skill the brain is missing (F-B7 2d)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const skillBody = "---\nname: local-mirror\n---\nMirror a Notion zone into the vault.\n";
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", skillBody);
  const target = manifest(); // local-mirror is NOT a merge skill — it is staged
  const local = manifest({ ragVersion: "1.0.0" });

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(readFileSync(join(brainDir, ".claude/skills/local-mirror/SKILL.md"), "utf8"), skillBody, "the staged skill lands under .claude/skills/");
  assert.ok(report.installedSkills.includes("local-mirror"), "a staged skill is reported in installedSkills");
});

// ── Test 15: F-B7 2e — the engine MCP servers to register are derived from the keys of
//    the DELIVERED `.mcp.json.template`, NOT the frozen `manifest.engineMcpServers` (which
//    update-engine never refreshes — the root cause). Here the manifest is STALE (only
//    vault-rag) but the delivered template carries local-mirror → it must STILL register.
test("reconcileBrain — registers MCP servers from the DELIVERED template keys, not the frozen manifest (F-B7 2e)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(brainDir, ".mcp.json", JSON.stringify({ mcpServers: { "vault-rag": { type: "stdio" } } }, null, 2));
  writeFile(
    sourceDir,
    ".mcp.json.template",
    JSON.stringify(
      { mcpServers: { "vault-rag": { type: "stdio", cwd: "{{PROJECT_ROOT}}" }, "local-mirror": { type: "stdio", cwd: "{{PROJECT_ROOT}}" } } },
      null,
      2,
    ),
  );
  // The manifest is FROZEN at v3.1.0: it names ONLY vault-rag. The delivered template is
  // the source of truth → local-mirror must register despite the stale manifest.
  const target = manifest({ engineMcpServers: ["vault-rag"] });
  const local = manifest({ ragVersion: "1.0.0" });

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.deepEqual(report.mcpServersAdded, ["local-mirror"], "the template's local-mirror server registers even though the manifest is stale");
  const raw = readFileSync(join(brainDir, ".mcp.json"), "utf8");
  const mcp = JSON.parse(raw);
  assert.ok(mcp.mcpServers["local-mirror"], "local-mirror is now in .mcp.json");
  assert.ok(mcp.mcpServers["vault-rag"], "vault-rag is preserved");
  // {{PROJECT_ROOT}} must arrive SUBSTITUTED (and POSIX-normalised): an unsubstituted
  // placeholder means an MCP server that cannot start, and the brain loses its RAG.
  assert.equal(mcp.mcpServers["local-mirror"].cwd, toPosixPath(brainDir));
  // …and the file stays a well-formed text file: it is git-committed, and a missing
  // final newline puts a "\ No newline at end of file" in every diff that touches it.
  assert.equal(raw, JSON.stringify(mcp, null, 2) + "\n");
});

// Tiny indirection so the helpers above read cleanly; resolves the lazily-loaded export.
async function reconcile(args) {
  const reconcileBrain = await loadReconciler();
  return reconcileBrain(args);
}

// The same indirection for the CLI entry the auto-finalize child and the SessionStart
// self-heal both run — it is the LAST writer of the manifest on those paths, so the
// F1 tests above have to go through it rather than through `reconcileBrain` alone.
async function reconcileCli(args) {
  const runReconcileCli = await loadCli();
  return runReconcileCli(args);
}

// ═══════════════════════════════════════════════════════════════════════════
// Increment 2.5 — refresh an UNTOUCHED engine skill. Until now an already-present
// skill dir was skipped wholesale (install-if-absent), so 12 skill commits since
// v3.2.2 reached nobody. The refresh is gated on the sha256 provenance base every
// brain already records: overwrite ONLY what is provably byte-identical to what the
// engine last delivered.
// ═══════════════════════════════════════════════════════════════════════════

// The digest shape the manifest's `provenance` records (engine-source.fingerprint).
function base(content) {
  return "sha256:" + createHash("sha256").update(content).digest("hex");
}

test("reconcileBrain — an UNTOUCHED engine skill is refreshed to the source's version", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // The brain carries the skill EXACTLY as the engine last delivered it (v3.6.0),
  // the source carries the improved one (v3.6.2) — the real 4e43e70 case.
  const delivered = "---\nname: switch\n---\nSwitch universes.\n";
  const improved = delivered + "\nSingle-account native-connectors reminder.\n";
  writeFile(brainDir, ".claude/skills/switch/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", improved);
  const target = manifest({ extraMerge: [".claude/skills/switch/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/switch/**"] }),
    provenance: { ".claude/skills/switch/SKILL.md": base(delivered) },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/switch/SKILL.md"), "utf8"),
    improved,
    "the untouched skill now carries the engine's newer version",
  );
  assert.deepEqual(report.skillsRefreshed, ["switch"]);
  assert.deepEqual(report.skillsPreserved, []);
});

// S2a-3b: the merge produced its verdicts one layer down, and this is the layer that
// used to drop them — `reconcileBrain` destructured three fields and returned three.
// A merge nobody is told about lands silently; a conflict nobody is told about is a
// `.new` file appearing beside a skill with no explanation.
test("reconcileBrain — a merged skill and a clashing one both reach the report", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: switch\n---\n\nSwitch universes.\n\nThe closing note.\n";
  const owners = "---\nname: switch\n---\n\nSwitch universes, my way.\n\nThe closing note.\n";
  const engines = delivered.replace("The closing note.\n", "The closing note.\n\nA paragraph the engine added.\n");
  const clashing = "---\nname: coach\n---\n\nThe engine's own rewrite.\n";
  const coachDelivered = "---\nname: coach\n---\n\nThe original line.\n";
  const coachOwners = "---\nname: coach\n---\n\nThe owner's own rewrite.\n";

  writeFile(brainDir, ".claude/skills/switch/SKILL.md", owners);
  writeFile(brainDir, ".engine-base/.claude/skills/switch/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", engines);
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", coachOwners);
  writeFile(brainDir, ".engine-base/.claude/skills/coach/SKILL.md", coachDelivered);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", clashing);

  const extraMerge = [".claude/skills/switch/**", ".claude/skills/coach/**"];
  const target = manifest({ extraMerge });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge }),
    provenance: {
      ".claude/skills/switch/SKILL.md": base(delivered),
      ".claude/skills/coach/SKILL.md": base(coachDelivered),
    },
  };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.deepEqual(report.skillsMerged, ["switch"]);
  assert.deepEqual(report.conflicts, [
    { name: "coach", newVersionPath: ".claude/skills/coach/SKILL.md.new" },
  ]);
  assert.match(
    readFileSync(join(brainDir, ".claude/skills/switch/SKILL.md"), "utf8"),
    /my way[\s\S]*A paragraph the engine added/,
    "the owner's edit and the engine's addition both survive the round trip",
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// S2b-3 — the four engine SCRIPTS stop arriving by copy.
// `auto-commit`, `auto-push`, `status-line` and `verify-rag` are declared `merge`
// in every shipped manifest, and the reconciler copied them anyway: an owner who
// tuned their auto-commit hook lost the tuning at the next update, silently. What
// is asserted here is the WIRING — that `reconcileBrain` routes them through the
// merge rather than through `copyGlobs`, and hands the verdicts back up.
// ═══════════════════════════════════════════════════════════════════════════

// ⚠️ The pairing that makes this slice one commit and not two: the moment a
// merge-declared script leaves the copy bucket, SOMETHING has to deliver it. A
// brain that never touched its auto-commit must still receive the engine's fix.
test("reconcileBrain — an untouched engine script is delivered by the merge, not the copy", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "export const hook = 1;\n";
  const improved = "export const hook = 1;\nexport const fixed = true;\n";
  writeFile(brainDir, "scripts/auto-commit.mjs", delivered);
  writeFile(sourceDir, "scripts/auto-commit.mjs", improved);
  const extraMerge = ["scripts/auto-commit.mjs"];
  const target = manifest({ extraMerge });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge }),
    provenance: { "scripts/auto-commit.mjs": base(delivered) },
  };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.equal(readFileSync(join(brainDir, "scripts/auto-commit.mjs"), "utf8"), improved);
  assert.deepEqual(report.scriptsRefreshed, ["scripts/auto-commit.mjs"]);
  // ...and NOT through the copy bucket, or it would be counted twice in the report
  // and, worse, written before the merge ever got to look at it.
  assert.deepEqual(report.copied, ["rag/package.json", "rag/src/index.ts"]);
  // The delivered bytes are the CANDIDATE, so `runReconcileCli` can re-seed the base.
  assert.equal(report.refreshedFileMap["scripts/auto-commit.mjs"], improved);
});

// The bug in one test: the owner tuned their commit-message prefix, the engine fixed
// something else in the same file, and until this slice the tuning was gone.
test("reconcileBrain — an EDITED engine script keeps the edit AND takes the update", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "export const prefix = \"chore\";\n\nexport function run() {\n  return prefix;\n}\n";
  const mine = delivered.replace('"chore"', '"brain"');
  const engines = delivered + "\nexport const fixed = true;\n";
  writeFile(brainDir, "scripts/auto-push.mjs", mine);
  writeFile(brainDir, ".engine-base/scripts/auto-push.mjs", delivered);
  writeFile(sourceDir, "scripts/auto-push.mjs", engines);
  const extraMerge = ["scripts/auto-push.mjs"];
  const target = manifest({ extraMerge });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge }),
    provenance: { "scripts/auto-push.mjs": base(delivered) },
  };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.match(
    readFileSync(join(brainDir, "scripts/auto-push.mjs"), "utf8"),
    /"brain"[\s\S]*export const fixed = true;/,
    "both sides landed in a file the brain will RUN",
  );
  assert.deepEqual(report.scriptsMerged, ["scripts/auto-push.mjs"]);
  assert.deepEqual(report.scriptsPreserved, []);
  assert.deepEqual(report.scriptConflicts, []);
});

// The verdicts a script can reach that a skill cannot, and the fields that carry
// them: `scriptConflicts` is its own list, so a clashing script can never be
// mistaken for a clashing skill in the report.
test("reconcileBrain — a clashing engine script gets its OWN conflict list", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "export const mode = \"a\";\n";
  const mine = "export const mode = \"mine\";\n";
  const engines = "export const mode = \"engine\";\n";
  writeFile(brainDir, "scripts/verify-rag.mjs", mine);
  writeFile(brainDir, ".engine-base/scripts/verify-rag.mjs", delivered);
  writeFile(sourceDir, "scripts/verify-rag.mjs", engines);
  const extraMerge = ["scripts/verify-rag.mjs"];
  const target = manifest({ extraMerge });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge }),
    provenance: { "scripts/verify-rag.mjs": base(delivered) },
  };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.equal(readFileSync(join(brainDir, "scripts/verify-rag.mjs"), "utf8"), mine, "no markers in a file we RUN");
  assert.deepEqual(report.scriptConflicts, [
    { name: "scripts/verify-rag.mjs", newVersionPath: "scripts/verify-rag.mjs.new" },
  ]);
  assert.deepEqual(report.conflicts, [], "and the skills' list stays the skills'");
});

// 🛑 The gate, end to end, and the reason the scripts are not simply a second call to
// the skills' refresher. `reconcileBrain` must hand `refreshEngineScripts` no gate at
// all — the module's own default is the gate — so a merge whose bytes do not parse
// leaves the brain running the script it was already running.
test("reconcileBrain — a merged script that would not parse never reaches the disk", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // Both sides edit DIFFERENT lines, so git merges them cleanly — and the result is
  // an unbalanced brace. A textually clean merge that does not parse is exactly the
  // failure mode the syntax gate exists for.
  const delivered = "export function run() {\n  return 1;\n}\n\nexport const tail = 0;\n";
  const mine = "export function run( {\n  return 1;\n}\n\nexport const tail = 0;\n";
  const engines = delivered.replace("export const tail = 0;", "export const tail = 42;");
  writeFile(brainDir, "scripts/status-line.mjs", mine);
  writeFile(brainDir, ".engine-base/scripts/status-line.mjs", delivered);
  writeFile(sourceDir, "scripts/status-line.mjs", engines);
  const extraMerge = ["scripts/status-line.mjs"];
  const target = manifest({ extraMerge });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge }),
    provenance: { "scripts/status-line.mjs": base(delivered) },
  };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.equal(readFileSync(join(brainDir, "scripts/status-line.mjs"), "utf8"), mine);
  assert.deepEqual(report.scriptsPreserved, [
    { name: "scripts/status-line.mjs", reason: "merge-unsafe", newVersionPath: "scripts/status-line.mjs.new" },
  ]);
  assert.deepEqual(report.scriptsMerged, []);
});

// The self-heal path passes the brain as its own source, and nobody asked for an
// update there. The skills already hold this line; the scripts must hold it too, or
// a SessionStart tick would start writing sidecars beside files nobody touched.
test("reconcileBrain — self-heal touches no engine script and reports none", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const mine = "export const hook = \"mine\";\n";
  writeFile(brainDir, "scripts/auto-commit.mjs", mine);
  const extraMerge = ["scripts/auto-commit.mjs"];
  const target = manifest({ extraMerge });
  const local = { ...manifest({ extraMerge }), provenance: {} };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir: brainDir, target, local, ...seams() });

  assert.equal(readFileSync(join(brainDir, "scripts/auto-commit.mjs"), "utf8"), mine);
  assert.deepEqual(report.scriptsRefreshed, []);
  assert.deepEqual(report.scriptsPreserved, []);
});

// ═══════════════════════════════════════════════════════════════════════════
// THE DOCTRINE LAYER, third merge family (plan S5c-1). `CLAUDE.engine.md` was in
// no regime for the product's whole life, so the ambient doctrine of every brain
// was frozen at install day while the skills, scripts and servers moved on eight
// times. What is asserted here is the WIRING — that `reconcileBrain` calls the
// family, hands its verdicts back up in lists of their own, and folds its
// delivered bytes into the ONE map that re-seeds provenance.
// ═══════════════════════════════════════════════════════════════════════════

test("reconcileBrain — an untouched constitution is delivered by the merge, and its bytes re-seed the base", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "# Engine doctrine\n\nRule one.\n";
  const improved = "# Engine doctrine\n\nRule one.\n\nRule two.\n";
  writeFile(brainDir, "CLAUDE.engine.md", delivered);
  writeFile(sourceDir, "CLAUDE.engine.md", improved);
  const extraMerge = ["CLAUDE.engine.md"];
  const target = manifest({ extraMerge });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge }),
    provenance: { "CLAUDE.engine.md": base(delivered) },
  };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.equal(readFileSync(join(brainDir, "CLAUDE.engine.md"), "utf8"), improved);
  assert.deepEqual(report.doctrineRefreshed, ["CLAUDE.engine.md"]);
  // ...and NOT through the copy bucket: `copyGlobs` is `plan.overwrite` alone, so a
  // doctrine file arriving there too would be written before the merge ever looked.
  assert.deepEqual(report.copied, ["rag/package.json", "rag/src/index.ts"]);
  // 🛑 The half that makes the unfreeze work more than once: left out of this map, the
  // file would be called "user-modified" at the very next update and freeze again.
  assert.equal(report.refreshedFileMap["CLAUDE.engine.md"], improved);
});

// 🛑 EVERY brain deployed before this release is this test, so the wiring has to
// carry the honest verdict all the way up — not just the happy one.
test("reconcileBrain — a constitution with no provenance is preserved, and says so in its own list", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const theirs = "# Engine doctrine\n\nInstalled long ago.\n";
  writeFile(brainDir, "CLAUDE.engine.md", theirs);
  writeFile(sourceDir, "CLAUDE.engine.md", "# Engine doctrine\n\nTwelve commits later.\n");
  const extraMerge = ["CLAUDE.engine.md"];
  const target = manifest({ extraMerge });
  const local = { ...manifest({ ragVersion: "1.0.0", extraMerge }), provenance: {} };

  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...seams() });

  assert.equal(readFileSync(join(brainDir, "CLAUDE.engine.md"), "utf8"), theirs, "unproven bytes stand");
  assert.deepEqual(report.doctrinePreserved, [{ name: "CLAUDE.engine.md", reason: "no-provenance", newVersionPath: "CLAUDE.engine.md.new" }]);
  assert.deepEqual(report.doctrineRefreshed, []);
  assert.equal(report.refreshedFileMap["CLAUDE.engine.md"], undefined, "nothing delivered, no ancestor claimed");
});

test("reconcileBrain — a CUSTOMIZED skill is preserved byte-for-byte and reported as such", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // The documented case: the owner refined prepare-1-1 to their own KPIs.
  const delivered = "---\nname: prepare-1-1\n---\nPrepare a 1-1.\n";
  const mine = delivered + "\n## My own KPIs\nARR, churn.\n";
  writeFile(brainDir, ".claude/skills/prepare-1-1/SKILL.md", mine);
  writeFile(sourceDir, ".claude/skills/prepare-1-1/SKILL.md", delivered + "\nNew engine section.\n");
  const target = manifest({ extraMerge: [".claude/skills/prepare-1-1/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/prepare-1-1/**"] }),
    provenance: { ".claude/skills/prepare-1-1/SKILL.md": base(delivered) },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/prepare-1-1/SKILL.md"), "utf8"),
    mine,
    "the owner's customized skill is untouched",
  );
  assert.deepEqual(report.skillsRefreshed, []);
  assert.deepEqual(report.skillsPreserved, [
    { name: "prepare-1-1", reason: "customized", newVersionPath: ".claude/skills/prepare-1-1/SKILL.md.new" },
  ]);
});

test("reconcileBrain — the new version of a customized skill is dropped alongside as .new", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // "We never overwrite your version" must not mean "you never get the improvement":
  // the engine's version is left BESIDE the owner's, so adopting it (or cherry-picking
  // from it) is a conversation away instead of invisible. Conffile fallback, plan §The
  // decision. `.new` is not a `SKILL.md`, so Claude never loads it as a second skill.
  const delivered = "---\nname: prepare-1-1\n---\nPrepare a 1-1.\n";
  const mine = delivered + "\n## My own KPIs\nARR, churn.\n";
  const candidate = delivered + "\nNew engine section.\n";
  writeFile(brainDir, ".claude/skills/prepare-1-1/SKILL.md", mine);
  writeFile(sourceDir, ".claude/skills/prepare-1-1/SKILL.md", candidate);
  const target = manifest({ extraMerge: [".claude/skills/prepare-1-1/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/prepare-1-1/**"] }),
    provenance: { ".claude/skills/prepare-1-1/SKILL.md": base(delivered) },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/prepare-1-1/SKILL.md.new"), "utf8"),
    candidate,
    "the engine version is available, verbatim, next to the owner's",
  );
  assert.deepEqual(report.skillsPreserved, [
    { name: "prepare-1-1", reason: "customized", newVersionPath: ".claude/skills/prepare-1-1/SKILL.md.new" },
  ]);
});

// A skill is a SUBTREE, not a single `SKILL.md`: a release may add a `references/`
// or `examples/` file to a skill the brain already has. install-if-absent can never
// deliver it (it skips at the skill-DIR level, and the dir exists), so if the refresh
// drops the `absent-install` verdict too, that file reaches NO deployed brain — the
// very core/skill drift this increment closes, one level deeper.
test("reconcileBrain — a NEW file under an ALREADY-INSTALLED skill is delivered, not dropped", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: coach\n---\nBe a fierce coach.\n";
  const added = "# Radical Candor\nCare personally, challenge directly.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", delivered); // untouched AND up to date
  writeFile(sourceDir, ".claude/skills/coach/references/radical-candor.md", added); // the newcomer
  const target = manifest({ extraMerge: [".claude/skills/coach/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/coach/**"] }),
    provenance: { ".claude/skills/coach/SKILL.md": base(delivered) },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/references/radical-candor.md"), "utf8"),
    added,
    "the file the release added under the existing skill actually landed",
  );
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"),
    delivered,
    "and the already-converged sibling was not rewritten for nothing",
  );
  assert.deepEqual(report.skillsRefreshed, ["coach"]);
  assert.deepEqual(report.skillsPreserved, []);
});

// A pre-provenance brain: the file is engine-shipped but nothing was ever fingerprinted
// for it, so "untouched" is UNPROVABLE. We keep the owner's copy either way, and the two
// preserves are still NOT the same report: `no-provenance` must not call them a customizer.
//
// ⚠️ INVERTED at S10-1. This test read "…preserved WITHOUT a .new" and asserted that a
// claim we cannot make must not be pointed at. S10 changes what the sidecar means: it is
// no longer a claim ("a newer version awaits you"), it is the material the next
// conversation needs to ask a question and offer three answers. The `reason` still
// carries the distinction the old rule was protecting.
//
// The second half is UNCHANGED and gets sharper: a sidecar left by an earlier update
// must not survive as itself. It is cleared unconditionally and re-dropped with the
// CURRENT candidate, so what sits there is never a stale claim.
test("reconcileBrain — an UNPROVABLE skill keeps its bytes, and a stale sidecar is replaced, not kept", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const theirs = "---\nname: coach\n---\nYour sparring partner, as they have it.\n";
  const candidate = theirs + "\nA newer engine section.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", theirs);
  writeFile(brainDir, ".claude/skills/coach/SKILL.md.new", "left over from an earlier update\n");
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", candidate);
  const target = manifest({ extraMerge: [".claude/skills/coach/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/coach/**"] }),
    provenance: {}, // nothing was ever recorded for this file
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"), theirs);
  assert.deepEqual(report.skillsRefreshed, []);
  assert.deepEqual(
    report.skillsPreserved,
    [{ name: "coach", reason: "no-provenance", newVersionPath: ".claude/skills/coach/SKILL.md.new" }],
    "reported as unprovable, NOT as a customization — the reason is what carries that",
  );
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md.new"), "utf8"),
    candidate,
    "the leftover from an earlier update is REPLACED by this update's candidate, never kept",
  );
});

// The report speaks in SKILLS, the refresh works in FILES. Now that a skill can hold more
// than one engine file, the two counts diverge: what the owner must read is "your coach
// skill was brought up to date", once, not the same name repeated per file touched.
test("reconcileBrain — TWO refreshed files in ONE skill are reported as ONE skill", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const skillWas = "---\nname: coach\n---\nYour sparring partner.\n";
  const refWas = "# Radical Candor\nCare personally.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", skillWas);
  writeFile(brainDir, ".claude/skills/coach/references/radical-candor.md", refWas);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", skillWas + "Now with examples.\n");
  writeFile(sourceDir, ".claude/skills/coach/references/radical-candor.md", refWas + "Challenge directly.\n");
  const target = manifest({ extraMerge: [".claude/skills/coach/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/coach/**"] }),
    provenance: {
      ".claude/skills/coach/SKILL.md": base(skillWas),
      ".claude/skills/coach/references/radical-candor.md": base(refWas),
    },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.deepEqual(report.skillsRefreshed, ["coach"], "named once, not once per file");
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"),
    skillWas + "Now with examples.\n",
  );
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/references/radical-candor.md"), "utf8"),
    refWas + "Challenge directly.\n",
    "both files moved, even though the skill is named once",
  );
});

test("reconcileBrain — TWO customized files in ONE skill are reported once, but BOTH get a .new", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const skillWas = "---\nname: coach\n---\nYour sparring partner.\n";
  const refWas = "# Radical Candor\nCare personally.\n";
  const skillNext = skillWas + "Engine's newer take.\n";
  const refNext = refWas + "Engine's newer reference.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", skillWas + "MY OWN tone.\n");
  writeFile(brainDir, ".claude/skills/coach/references/radical-candor.md", refWas + "MY OWN notes.\n");
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", skillNext);
  writeFile(sourceDir, ".claude/skills/coach/references/radical-candor.md", refNext);
  const target = manifest({ extraMerge: [".claude/skills/coach/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/coach/**"] }),
    provenance: {
      ".claude/skills/coach/SKILL.md": base(skillWas),
      ".claude/skills/coach/references/radical-candor.md": base(refWas),
    },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(report.skillsPreserved.length, 1, "one line per SKILL, not per file");
  assert.deepEqual(
    report.skillsPreserved.map(({ name, reason }) => ({ name, reason })),
    [{ name: "coach", reason: "customized" }],
  );
  // Reporting once must not mean delivering once: every customized file still gets its own
  // sidecar, or the owner silently loses the engine's newer version of the unnamed one.
  assert.equal(readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md.new"), "utf8"), skillNext);
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/references/radical-candor.md.new"), "utf8"),
    refNext,
  );
});

// ── STAGED skills (engine-skills/) get the same treatment as the merge 9 ─────
// A staged skill (local-mirror, lint, open-note…) is delivered install-if-absent from
// the non-sacred `engine-skills/<name>/` path, and provenance is recorded for `merge`
// files only — so it had NO base and would read `no-provenance` forever, frozen at the
// version it was installed at. Its base costs nothing though: the brain's OWN
// `engine-skills/<name>/` copy, read BEFORE this update overwrites it, IS byte-for-byte
// what the engine last delivered (install-if-absent copied that very subtree).
test("reconcileBrain — an untouched STAGED skill is refreshed, using the brain's own staging copy as the base", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: lint\n---\nLint the vault.\n";
  const next = delivered + "\nNow reports orphan notes too.\n";
  writeFile(brainDir, ".claude/skills/lint/SKILL.md", delivered); // installed at a past update
  writeFile(brainDir, "engine-skills/lint/SKILL.md", delivered); // …from THIS staging copy
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", next);
  const opts = { extraReplace: ["engine-skills/**"] };
  const target = manifest(opts);
  const local = manifest({ ragVersion: "1.0.0", ...opts });

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(readFileSync(join(brainDir, ".claude/skills/lint/SKILL.md"), "utf8"), next);
  assert.deepEqual(report.skillsRefreshed, ["lint"]);
});

test("reconcileBrain — a CUSTOMIZED staged skill is preserved too (the staging base discriminates)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // Same fixture as above, except the owner edited their installed copy. The staging
  // tree still holds what the engine delivered, so the divergence is provable — and a
  // staged skill earns exactly the same protection as a merge one.
  const delivered = "---\nname: lint\n---\nLint the vault.\n";
  const mine = delivered + "\n## My own rules\nNo orphan meeting notes.\n";
  const next = delivered + "\nNow reports orphan notes too.\n";
  writeFile(brainDir, ".claude/skills/lint/SKILL.md", mine);
  writeFile(brainDir, "engine-skills/lint/SKILL.md", delivered);
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", next);
  const opts = { extraReplace: ["engine-skills/**"] };

  const { ...s } = seams();
  const report = await reconcile({
    brainDir,
    platform: "posix",
    sourceDir,
    target: manifest(opts),
    local: manifest({ ragVersion: "1.0.0", ...opts }),
    ...s,
  });

  assert.equal(readFileSync(join(brainDir, ".claude/skills/lint/SKILL.md"), "utf8"), mine);
  assert.deepEqual(report.skillsRefreshed, []);
  assert.deepEqual(report.skillsPreserved, [
    { name: "lint", reason: "customized", newVersionPath: ".claude/skills/lint/SKILL.md.new" },
  ]);
  assert.equal(readFileSync(join(brainDir, ".claude/skills/lint/SKILL.md.new"), "utf8"), next);
});

test("reconcileBrain — a stale .new is cleared once the owner has adopted the new version", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // The owner read the `.new` we dropped last time and pasted it over their own file.
  // Leaving the sidecar behind would keep claiming "a newer version awaits" forever —
  // a stale prompt to do work that is already done.
  const candidate = "---\nname: prepare-1-1\n---\nPrepare a 1-1.\nNew engine section.\n";
  writeFile(brainDir, ".claude/skills/prepare-1-1/SKILL.md", candidate);
  writeFile(brainDir, ".claude/skills/prepare-1-1/SKILL.md.new", candidate);
  writeFile(sourceDir, ".claude/skills/prepare-1-1/SKILL.md", candidate);
  const target = manifest({ extraMerge: [".claude/skills/prepare-1-1/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/prepare-1-1/**"] }),
    provenance: { ".claude/skills/prepare-1-1/SKILL.md": base(candidate) },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(
    existsSync(join(brainDir, ".claude/skills/prepare-1-1/SKILL.md.new")),
    false,
    "nothing newer is pending → the sidecar must not survive",
  );
  assert.deepEqual(report.skillsPreserved, []);
});

test("reconcileBrain — SessionStart self-heal (sourceDir === brainDir) refreshes NOTHING and reports nothing", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  // Same fixture as the customized case, but the brain is its own source: the local
  // converge has no new content, and nobody asked for an update. A skill is only ever
  // overwritten during an explicit update — and the owner is not nagged at every start.
  const delivered = "---\nname: prepare-1-1\n---\nPrepare a 1-1.\n";
  const mine = delivered + "\n## My own KPIs\nARR, churn.\n";
  writeFile(brainDir, ".claude/skills/prepare-1-1/SKILL.md", mine);
  const target = manifest({ extraMerge: [".claude/skills/prepare-1-1/**"] });
  const local = {
    ...manifest({ extraMerge: [".claude/skills/prepare-1-1/**"] }),
    provenance: { ".claude/skills/prepare-1-1/SKILL.md": base(delivered) },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir: brainDir, target, local, ...s });

  assert.equal(readFileSync(join(brainDir, ".claude/skills/prepare-1-1/SKILL.md"), "utf8"), mine);
  assert.deepEqual(report.skillsRefreshed, []);
  assert.deepEqual(report.skillsPreserved, [], "no nagging at session start");
});

test("reconcileBrain — a FR brain is refreshed from the FR source, never re-anglicized (T2)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  // The brain declares its install locale in its own (locale-owned) marker.
  writeFile(brainDir, "scripts/lib/demo-locale.mjs", 'export const BRAIN_LOCALE = "fr";\n');
  const deliveredFr = "---\nname: coach\n---\nTon sparring-partner.\n";
  const improvedFr = deliveredFr + "\nNouvelle section.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", deliveredFr);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", "---\nname: coach\n---\nYour sparring partner.\nNew section.\n");
  writeFile(sourceDir, "templates/fr/.claude/skills/coach/SKILL.md", improvedFr);
  const target = manifest({ extraMerge: [".claude/skills/coach/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/coach/**"] }),
    provenance: { ".claude/skills/coach/SKILL.md": base(deliveredFr) },
  };

  const { ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"),
    improvedFr,
    "the FR brain got the FR version of the newer skill",
  );
  assert.deepEqual(report.skillsRefreshed, ["coach"]);
});

// ── T1: the trap that would make this feature die silently after ONE use ─────
// A refreshed file no longer matches the base recorded for it. Unless the base is
// re-seeded, the NEXT update classifies it "user-modified" and never refreshes it
// again — the feature would work exactly once per brain, silently.
test("runReconcileCli — re-seeds the provenance base of what it refreshed (T1)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: switch\n---\nSwitch universes.\n";
  const improved = delivered + "\nSingle-account native-connectors reminder.\n";
  writeFile(brainDir, ".claude/skills/switch/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", improved);
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        ...manifest({ extraMerge: [".claude/skills/switch/**"] }),
        provenance: { ".claude/skills/switch/SKILL.md": base(delivered) },
      },
      null,
      2,
    ),
  );

  const { ...s } = seams();
  const runReconcileCli = await loadCli();
  const report = await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: s,
  });

  assert.deepEqual(report.skillsRefreshed, ["switch"]);
  const persisted = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(
    persisted.provenance[".claude/skills/switch/SKILL.md"],
    base(improved),
    "the base now describes what the engine JUST delivered",
  );
});

// ── S4: the base's VERSION, written by the same last writer as its digest ─────
// A digest says "this file matches what we shipped"; it cannot say WHICH shipment.
// The child re-seeds here for the same reason it re-seeds the digest: on the first
// update carrying this feature the parent runs the OLD code, so a ref written only by
// step 7 would arrive one update late — on the very brains being migrated.
test("runReconcileCli — stamps the engine version on what it refreshed, and leaves the held-back file's older one (S4)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: switch\n---\nSwitch universes.\n";
  const improved = delivered + "\nSingle-account native-connectors reminder.\n";
  writeFile(brainDir, ".claude/skills/switch/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", improved);
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        ...manifest({ extraMerge: [".claude/skills/switch/**"] }),
        provenance: { ".claude/skills/switch/SKILL.md": base(delivered) },
        baseRefs: { ".claude/skills/switch/SKILL.md": "v0.9.0", "CLAUDE.md": "v0.9.0" },
      },
      null,
      2,
    ),
  );

  const runReconcileCli = await loadCli();
  await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: seams(),
  });

  const persisted = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.deepEqual(persisted.baseRefs, {
    ".claude/skills/switch/SKILL.md": "v1.1.0",
    "CLAUDE.md": "v0.9.0",
  });
});

// The ref comes from the brain's own manifest, and a brain can have none (a very old
// install, or a source block written before refs were recorded). "I do not know" must
// stay unrecorded: an invented ref is a divergence report naming a version the owner
// was never delivered, which is worse than the silence this whole chantier is fixing.
test("runReconcileCli — a brain whose manifest records no ref stamps nothing, rather than a lie (S4)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: switch\n---\nSwitch universes.\n";
  const improved = delivered + "\nSingle-account native-connectors reminder.\n";
  writeFile(brainDir, ".claude/skills/switch/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", improved);
  const { source: _dropped, ...refless } = manifest({ extraMerge: [".claude/skills/switch/**"] });
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify({ ...refless, provenance: { ".claude/skills/switch/SKILL.md": base(delivered) } }, null, 2),
  );

  const runReconcileCli = await loadCli();
  const report = await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: seams(),
  });

  // The refresh itself still happened — the missing ref costs the RECORD, not the file.
  assert.deepEqual(report.skillsRefreshed, ["switch"]);
  const persisted = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.deepEqual(persisted.baseRefs, {});
});

// ── S1 — the LAST writer on the update path also lays down the base TREE ──────
// The child is where the tree must land as much as the record: on the first update
// carrying this feature the parent runs the OLD code, so a tree written only by
// step 7 would arrive one update late — on the very brains being migrated. Both
// halves are visible here: the refreshed skill ADVANCES to what was delivered, and
// a merge file the update never touched SEEDS from itself.
test("runReconcileCli — writes the `.engine-base/` tree beside the record: advanced for the refresh, seeded for the untouched", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: switch\n---\nSwitch universes.\n";
  const improved = delivered + "\nSingle-account native-connectors reminder.\n";
  writeFile(brainDir, ".claude/skills/switch/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", improved);
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        ...manifest({ extraMerge: [".claude/skills/switch/**"] }),
        provenance: {
          ".claude/skills/switch/SKILL.md": base(delivered),
          ".claude/skills/zzz-mine/SKILL.md": base(SACRED[".claude/skills/zzz-mine/SKILL.md"]),
        },
      },
      null,
      2,
    ),
  );

  const { ...s } = seams();
  const runReconcileCli = await loadCli();
  await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: s,
  });

  // Read through absence rather than into it: a tree that was never written must fail
  // this test on its assertion, saying what is missing, not on an ENOENT from a reader.
  const baseOrNull = (rel) => {
    const abs = join(brainDir, ".engine-base", rel);
    return existsSync(abs) ? readFileSync(abs, "utf8") : null;
  };

  assert.equal(
    baseOrNull(".claude/skills/switch/SKILL.md"),
    improved,
    "the refreshed skill's ancestor is the content the child just delivered",
  );
  assert.equal(
    baseOrNull(".claude/skills/zzz-mine/SKILL.md"),
    SACRED[".claude/skills/zzz-mine/SKILL.md"],
    "a merge file still matching its record seeds its own ancestor, with nothing fetched",
  );
  assert.equal(
    existsSync(join(brainDir, ".engine-base/rag/src/index.ts")),
    false,
    "a `replace` file has no base: the tree follows the `merge` regime",
  );
});

test("runReconcileCli — refreshing twice in a row is a clean no-op, NOT a 'customized' verdict (T1)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: coach\n---\nYour sparring partner.\n";
  const improved = delivered + "\nA newer section.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", delivered);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", improved);
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        ...manifest({ extraMerge: [".claude/skills/coach/**"] }),
        provenance: { ".claude/skills/coach/SKILL.md": base(delivered) },
      },
      null,
      2,
    ),
  );
  const runReconcileCli = await loadCli();
  const argv = ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"];

  const first = await runReconcileCli({ argv, seams: seams() });
  const second = await runReconcileCli({ argv, seams: seams() });

  assert.deepEqual(first.skillsRefreshed, ["coach"]);
  assert.deepEqual(second.skillsRefreshed, [], "nothing left to do the second time");
  assert.deepEqual(second.skillsPreserved, [], "the refreshed file is NOT mistaken for a customization");
  assert.equal(readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"), improved);
});

// ── T1's sibling, found by the release-fixture QA (plan Step 8) ──────────────
// install-if-absent (ADR 0025) delivers a skill the brain lacks — and recorded no base
// for it. That skill would then read "no-provenance" at EVERY later update and never be
// refreshed again: the exact freeze this increment removes, re-entering by the other
// door. The cohort that just received `switch` must not be frozen on it forever.
test("runReconcileCli — a skill it INSTALLS gets a provenance base, so the next update can refresh it", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: switch\n---\nSwitch universes.\n";
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", delivered); // absent from the brain
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify({ ...manifest({ extraMerge: [".claude/skills/switch/**"] }), provenance: {} }, null, 2),
  );

  const runReconcileCli = await loadCli();
  const report = await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: seams(),
  });

  assert.deepEqual(report.installedSkills, ["switch"]);
  const persisted = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(
    persisted.provenance[".claude/skills/switch/SKILL.md"],
    base(delivered),
    "the base describes what was just installed — without it the skill is frozen forever",
  );
});

// Same freeze, third door: a file delivered because it was MISSING under an existing
// skill needs a base too, or the release after it would read "no-provenance" and never
// improve it again. Proven end-to-end: deliver it, then ship a better one.
test("runReconcileCli — a file it delivers under an existing skill stays refreshable next time", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const skill = "---\nname: coach\n---\nYour sparring partner.\n";
  const added = "# Radical Candor\nCare personally.\n";
  const improved = added + "Challenge directly.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", skill);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", skill);
  writeFile(sourceDir, ".claude/skills/coach/references/radical-candor.md", added);
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        ...manifest({ extraMerge: [".claude/skills/coach/**"] }),
        provenance: { ".claude/skills/coach/SKILL.md": base(skill) },
      },
      null,
      2,
    ),
  );
  const runReconcileCli = await loadCli();
  const argv = ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"];

  const first = await runReconcileCli({ argv, seams: seams() });
  writeFile(sourceDir, ".claude/skills/coach/references/radical-candor.md", improved); // the NEXT release
  const second = await runReconcileCli({ argv, seams: seams() });

  assert.deepEqual(first.skillsRefreshed, ["coach"]);
  assert.deepEqual(second.skillsRefreshed, ["coach"], "still refreshable — not frozen on no-provenance");
  assert.deepEqual(second.skillsPreserved, []);
  assert.equal(readFileSync(join(brainDir, ".claude/skills/coach/references/radical-candor.md"), "utf8"), improved);
  const persisted = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(persisted.provenance[".claude/skills/coach/references/radical-candor.md"], base(improved));
});

// Every glob in the real manifest today is `<skill>/**`, so the SINGLE-star shape — a
// manifest declaring only a skill's top-level files — had never been fed. It must still
// resolve to the skill's DIRECTORY: get that wrong and install-if-absent tests a path
// that can never exist, so the skill is re-installed on every single update, and the
// report names it `*` instead of the skill.
test("reconcileBrain — a single-star skill glob still resolves to the skill's directory", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", "---\nname: coach\n---\nYour sparring partner.\n");
  const target = manifest({ extraMerge: [".claude/skills/coach/*"] });

  const first = await reconcile({ brainDir, platform: "posix", sourceDir, target, local: target, ...seams() });
  const second = await reconcile({ brainDir, platform: "posix", sourceDir, target, local: target, ...seams() });

  assert.deepEqual(first.installedSkills, ["coach"], "reported under the skill's name, not the wildcard");
  assert.equal(existsSync(join(brainDir, ".claude/skills/coach/SKILL.md")), true);
  assert.deepEqual(second.installedSkills, [], "the skill dir now exists → never re-installed");
});

// A caller that knows the TARGET but has no `local` manifest to offer (the shape any
// converge-only caller has). Provenance must then read as empty rather than crash: a
// throw here aborts the whole reconcile, and with it the launchers, the install and the
// reindex — for a brain that was merely missing a baseline.
test("reconcileBrain — a reconcile with no `local` manifest at all still converges", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const skill = "---\nname: coach\n---\nYour sparring partner.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", skill);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", skill + "Challenge directly.\n");
  const target = manifest({ extraMerge: [".claude/skills/coach/**"] });

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, ...s });

  assert.deepEqual(report.skillsRefreshed, [], "no base on record → nothing may be overwritten");
  assert.deepEqual(report.skillsPreserved, [
    { name: "coach", reason: "no-provenance", newVersionPath: ".claude/skills/coach/SKILL.md.new" },
  ]);
  assert.equal(readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"), skill, "the brain's copy is left alone");
  assert.deepEqual(calls.install, [join(brainDir, "rag")], "the rest of the converge still runs");
});

// ── The {{PROJECT_ROOT}} normalisation, made verifiable OFF Windows ──────────
// On a POSIX CI the transform is a no-op on every real path, so a regression in it
// would be invisible there and would only surface on the deployed Windows fleet — as
// a hook command Git Bash silently eats (issue #31). Fed a win32-shaped path instead.
test("toPosix — a Windows brain dir reaches the templates with forward slashes only", async () => {
  const { toPosix } = await import("./reconcile-brain.mjs");

  assert.equal(toPosix("C:\\Users\\me\\my-brain"), "C:/Users/me/my-brain");
  assert.equal(toPosix("/Users/me/my-brain"), "/Users/me/my-brain", "a POSIX path passes through untouched");
});

// The absent case for the launchers, never fed until now: a manifest that declares NO
// `regenerate` bucket. Regenerating launchers is not free (it rewrites four files, which
// the auto-commit hook then sees), so "nothing declared" must mean nothing done — and be
// reported as such. Mirror image of test 1, which only ever saw a populated bucket.
test("reconcileBrain — a manifest with an EMPTY regenerate bucket regenerates nothing", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const target = { ...manifest(), regimes: { ...manifest().regimes, regenerate: [] } };

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local: target, ...s });

  assert.deepEqual(calls.regenerate, [], "nothing declared → the launcher seam is never called");
  assert.equal(report.regenerated, false);
  assert.equal(existsSync(join(brainDir, "rag/launch.sh")), false, "no launcher may appear out of nowhere");
});

// …and its mirror: a populated bucket regenerates, and SAYS it did.
test("reconcileBrain — a populated regenerate bucket regenerates, and reports it", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const target = manifest();

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local: target, ...s });

  assert.deepEqual(calls.regenerate, ["posix"]);
  assert.equal(report.regenerated, true);
});

// ── The CLI's own contract: flag parsing, seam wiring, manifest write ────────
// `runReconcileCli` is what the auto-finalize CHILD is launched as, so its argv
// handling is load-bearing: a flag silently read as `undefined` converges the wrong
// folder (or nothing at all) while every in-process test stays green.

test("runReconcileCli — refuses to run without BOTH directories, whichever one is missing", async () => {
  const runReconcileCli = await loadCli();
  const required = /reconcile-brain: --brainDir and --sourceDir are required/;

  await assert.rejects(runReconcileCli({ argv: [] }), required);
  await assert.rejects(runReconcileCli({ argv: ["--brainDir", "/brains/mine"] }), required);
  await assert.rejects(runReconcileCli({ argv: ["--sourceDir", "/src"] }), required);
  // A flag in LAST position carries no value — indistinguishable from an absent one.
  await assert.rejects(runReconcileCli({ argv: ["--sourceDir", "/src", "--brainDir"] }), required);
});

// The platform decides which launcher halves get regenerated and which hook commands
// get the win32 repair, so a `--platform` that never reaches the seams is a silent
// cross-platform bug. Triangulated: the flag when given, this process's platform when not
// — and an ABSENT flag must yield NO value, never the first argv entry it happens to sit near.
test("runReconcileCli — the --platform flag reaches the seams, and defaults to this process's platform", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(brainDir, "engine-manifest.json", JSON.stringify(manifest(), null, 2));
  const runReconcileCli = await loadCli();

  const given = seams();
  await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "win32"],
    seams: given,
  });
  assert.deepEqual(given.calls.regenerate, ["win32"]);

  const omitted = seams();
  await runReconcileCli({ argv: ["--brainDir", brainDir, "--sourceDir", sourceDir], seams: omitted });
  assert.deepEqual(omitted.calls.regenerate, [process.platform]);
});

// The seams the caller DOES pass must be the ones used — the `?? default` fallbacks are
// there for the real child process, not to quietly override an injected double. Proven by
// a stub whose count no real vault would return, handed the brain it was asked about.
test("runReconcileCli — uses the seams it is given, brain and all, rather than the real I/O", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  writeFile(brainDir, "engine-manifest.json", JSON.stringify(manifest(), null, 2));

  const { calls, ...s } = seams();
  const runReconcileCli = await loadCli();
  const report = await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"],
    seams: s,
  });

  assert.equal(report.vaultNoteCount, STUB_VAULT_NOTES);
  assert.deepEqual(calls.count, [brainDir], "the note count must be taken on the brain being reconciled");
  assert.deepEqual(calls.install, [join(brainDir, "rag")]);
});

// The T1 re-seed writes the brain's manifest — the file every later update reads to decide
// what it may touch. Two things must hold, and neither was pinned: it is written as a
// well-formed text file (2-space indent + FINAL NEWLINE, it is git-committed and diffed at
// every update), and a run that delivers NOTHING must not rewrite it at all. The fixture is
// deliberately stored NON-canonically (compact JSON) so an unconditional rewrite is visible
// as a byte change instead of hiding behind identical formatting.
test("runReconcileCli — writes the manifest as a text file when it re-seeds, and not at all when it delivers nothing", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const manifestPath = join(brainDir, "engine-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest())); // compact, no trailing newline
  const untouched = readFileSync(manifestPath, "utf8");
  const runReconcileCli = await loadCli();
  const argv = ["--brainDir", brainDir, "--sourceDir", sourceDir, "--platform", "posix"];

  await runReconcileCli({ argv, seams: seams() });
  assert.equal(readFileSync(manifestPath, "utf8"), untouched, "nothing delivered → the manifest is not rewritten");

  // Now give the source a skill to deliver: the re-seed fires and rewrites the manifest.
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", "---\nname: coach\n---\nYour sparring partner.\n");
  writeFileSync(manifestPath, JSON.stringify(manifest({ extraMerge: [".claude/skills/coach/**"] })));
  await runReconcileCli({ argv, seams: seams() });

  const raw = readFileSync(manifestPath, "utf8");
  assert.equal(raw, JSON.stringify(JSON.parse(raw), null, 2) + "\n");
});

// ═══════════════════════════════════════════════════════════════════════════
// The COMPOSITION ROOT (Step 10). Everything above hands `runReconcileCli` its
// argv and its seams, so nothing exercised the process-level wiring: the argv
// slice, the error banner, the exit code, the entry-point guard. That is where
// the survivors clustered — the same shape, and the same fix, as
// `update-engine.mjs`'s `runUpdateCli(deps)` / `realUpdateDeps`.
// ═══════════════════════════════════════════════════════════════════════════

async function loadProcessCli() {
  return (await import("./reconcile-brain.mjs")).runReconcileCliProcess;
}

test("runReconcileCliProcess — a successful reconcile exits 0 and stays silent", async () => {
  const seen = [];
  const err = [];
  const runReconcileCliProcess = await loadProcessCli();

  const code = await runReconcileCliProcess({
    argv: ["--brainDir", "/brains/mine", "--sourceDir", "/src"],
    runReconcileCli: async (args) => seen.push(args) && { copied: [] },
    error: (s) => err.push(s),
  });

  assert.equal(code, 0);
  assert.deepEqual(err, [], "a successful reconcile is a silent finisher — it must not write to stderr");
  assert.deepEqual(seen, [{ argv: ["--brainDir", "/brains/mine", "--sourceDir", "/src"] }]);
});

// FAIL LOUD (the project's strategy): auto-finalize's own caller treats a child failure
// as best-effort, so this banner + exit code is the ONLY trace a broken reconcile leaves.
test("runReconcileCliProcess — a failure exits 1 and says exactly what broke", async () => {
  const err = [];
  const runReconcileCliProcess = await loadProcessCli();

  const code = await runReconcileCliProcess({
    argv: [],
    runReconcileCli: async () => {
      throw new Error("engine-manifest.json is unreadable");
    },
    error: (s) => err.push(s),
  });

  assert.equal(code, 1);
  assert.deepEqual(err, ["\n❌ reconcile-brain failed.\nengine-manifest.json is unreadable\n"]);
});

// The bottom of the barrel, twin of update-engine's: a rejection with NO reason at all
// (a thrown non-Error, an aborted child). A ❌ banner over an empty line tells nobody
// anything — and this is the one output a failed reconcile leaves behind.
test("runReconcileCliProcess — a rejection with no reason still explains itself", async () => {
  const err = [];
  const runReconcileCliProcess = await loadProcessCli();

  const code = await runReconcileCliProcess({
    argv: [],
    runReconcileCli: async () => {
      throw null;
    },
    error: (s) => err.push(s),
  });

  assert.equal(code, 1);
  assert.deepEqual(err, ["\n❌ reconcile-brain failed.\nno reason given\n"]);
});

// A thrown bare string has no `.message` — the fallback must print the string itself,
// not the word "undefined".
test("runReconcileCliProcess — a thrown bare string is printed as-is", async () => {
  const err = [];
  const runReconcileCliProcess = await loadProcessCli();

  const code = await runReconcileCliProcess({
    argv: [],
    runReconcileCli: async () => {
      throw "npm exited 137";
    },
    error: (s) => err.push(s),
  });

  assert.equal(code, 1);
  assert.deepEqual(err, ["\n❌ reconcile-brain failed.\nnpm exited 137\n"]);
});

// The wiring itself — the one thing `runReconcileCliProcess(deps)` can never prove,
// since every test above hands it doubles. If `realReconcileDeps` passed the wrong argv
// slice (node + the script path leaking in as flags) or a swallowing stream, the child
// would run flawlessly against nothing and say so.
test("realReconcileDeps — carries the process flags (not node/script) and the real stderr", async () => {
  const { realReconcileDeps, runReconcileCli } = await import("./reconcile-brain.mjs");

  assert.deepEqual(realReconcileDeps.argv, process.argv.slice(2));
  assert.equal(realReconcileDeps.runReconcileCli, runReconcileCli);

  const errs = [];
  const realErr = process.stderr.write;
  process.stderr.write = (s) => errs.push(s) && true;
  try {
    realReconcileDeps.error("boom\n");
  } finally {
    process.stderr.write = realErr;
  }
  assert.deepEqual(errs, ["boom\n"]);
});

// …and the last untested link: that the entry-point guard actually FIRES. Bug B2 was
// exactly this class — a guard that silently never matched, so running the command did
// nothing at all and said nothing about it. Everything above can be green while the
// script is an inert no-op, so run it for real, as a process. Safe by construction: with
// no flags it rejects before touching a single file.
test("the CLI entry point actually runs the reconcile (and fails LOUDLY, never silently)", () => {
  const script = fileURLToPath(new URL("./reconcile-brain.mjs", import.meta.url));

  const r = spawnSync(process.execPath, [script], { encoding: "utf8" });

  assert.equal(r.status, 1, "a script whose entry guard never fires would exit 0");
  assert.equal(r.stderr, "\n❌ reconcile-brain failed.\nreconcile-brain: --brainDir and --sourceDir are required\n");
  assert.equal(r.stdout, "", "a failed reconcile must not print anything to stdout");
});

// ── Test 14: ADR 0036 — the status line RETREATS. `statusLine` is a single value,
//    not a merged list, so as long as the brain declares ours the owner's own line
//    never runs — however silent ours becomes. The retreat therefore has to REMOVE
//    the key from a deployed brain, and the reconciler is the only write we ever make
//    to that sacred file. The provenance guard is the whole discipline: ours goes,
//    theirs stays.
test("reconcileBrain — removes the statusLine WE installed, and reports it", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const settingsIn = {
    ...v310Settings(brainDir),
    statusLine: { type: "command", command: `/usr/local/bin/node "${brainDir}/scripts/status-line.mjs"`, padding: 0 },
  };
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(settingsIn, null, 2) + "\n");
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();

  const report = await reconcile({
    brainDir, platform: "posix", sourceDir, target, local: manifest({ ragVersion: "1.0.0" }), ...seams(),
  });

  assert.equal(report.statusLineRemoved, true, "the owner must be told their own line is back");
  const settings = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  assert.equal("statusLine" in settings, false, "ours is gone entirely — a silent line would still evict theirs");
  assert.equal(settings.mine, true, "and nothing else in the sacred file is disturbed");
});

// ── ADR 0036's other half, and the one the retreat is FOR: a line that is theirs and
//    BROKEN. Every test above has either our line (retired) or a clean custom one, so
//    the healing branch — the only place we ever write into someone else's statusLine —
//    was never exercised. The retreat promises the owner's own line runs again; on a
//    deployed Windows brain that promise is worth nothing if the line Git Bash eats is
//    handed back unhealed. And with the hooks already converged, this repair is the ONLY
//    reason to write: a reconciler that did not count it would leave the file untouched.
test("reconcileBrain (win32) — the OWNER'S broken status line is healed in place, and that alone is worth a write", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const rootPosix = brainDir.split("\\").join("/");
  const rootWin = rootPosix.split("/").join("\\");
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(brokenWin32Settings(rootPosix), null, 2) + "\n");
  writeFile(brainDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();
  const local = manifest({ ragVersion: "1.0.0" });
  // Pass 1 converges the hooks and retires OURS, so pass 2 has nothing else left to do.
  await reconcile({ brainDir, platform: "win32", sourceDir: brainDir, target, local, ...seams() });

  // The owner then sets THEIR OWN line — with the same `cmd /c` prefix the pre-fix
  // installer taught them, because on Windows that was the only recipe they ever saw.
  const converged = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  const theirs = {
    type: "command",
    command: `cmd /c "${rootWin}\\scripts\\run-node.cmd" "${rootPosix}/my-own-prompt.mjs"`,
    padding: 0,
  };
  writeFile(brainDir, ".claude/settings.json", JSON.stringify({ ...converged, statusLine: theirs }, null, 2) + "\n");

  const report = await reconcile({ brainDir, platform: "win32", sourceDir: brainDir, target, local, ...seams() });

  const settings = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  assert.equal(report.statusLineRemoved, false, "theirs is not ours to retire");
  assert.deepEqual(
    settings.statusLine,
    {
      type: "command",
      command: `${rootPosix}/scripts/run-node.cmd "${rootPosix}/my-own-prompt.mjs"`,
      padding: 0,
    },
    "healed in place — and the rest of THEIR object survives, padding included",
  );
  assert.deepEqual(report.hooksRepaired, ["statusLine"], "the repair is reported, and nothing else is claimed");
  assert.equal(settings.mine, true, "the rest of the sacred file is untouched");
});

// The mirror, and the one that matters most: a line the OWNER configured is not ours
// to touch. Same discipline as engine-skill-refresh — overwrite only what we delivered.
test("reconcileBrain — a hand-customized statusLine is PRESERVED", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const mine = { type: "command", command: "starship prompt --terminal-width 120" };
  writeFile(brainDir, ".claude/settings.json", JSON.stringify({ ...v310Settings(brainDir), statusLine: mine }, null, 2) + "\n");
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();

  const report = await reconcile({
    brainDir, platform: "posix", sourceDir, target, local: manifest({ ragVersion: "1.0.0" }), ...seams(),
  });

  assert.equal(report.statusLineRemoved, false);
  const settings = JSON.parse(readFileSync(join(brainDir, ".claude/settings.json"), "utf8"));
  assert.deepEqual(settings.statusLine, mine, "their line, byte for byte");
});

// A converged brain that never had one: the reconcile must stay a no-op, or every
// update leaves an `auto:` commit behind and the byte-identical guarantee is lost.
test("reconcileBrain — a brain with no statusLine is not written for the retreat's sake", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const settingsPath = join(brainDir, ".claude/settings.json");
  writeFile(brainDir, ".claude/settings.json", JSON.stringify(v310Settings(brainDir), null, 2) + "\n");
  writeFile(sourceDir, ".claude/settings.json.template", JSON.stringify(templateSessionStart(), null, 2) + "\n");
  const target = manifest();
  // Converge first (this write is the hook wiring), then re-run: the second pass has
  // nothing left to do, and the retreat must not invent a reason to write.
  await reconcile({ brainDir, platform: "posix", sourceDir, target, local: manifest({ ragVersion: "1.0.0" }), ...seams() });
  const before = readFileSync(settingsPath, "utf8");

  const report = await reconcile({
    brainDir, platform: "posix", sourceDir, target, local: manifest({ ragVersion: "1.0.0" }), ...seams(),
  });

  assert.equal(report.statusLineRemoved, false);
  assert.equal(readFileSync(settingsPath, "utf8"), before, "byte-identical");
});

// The retreat's report defaults to FALSE, and that default is load-bearing. A source
// with no settings.json.template — a pre-ADR-0026 fetch, or a brain self-healing before
// it ever received one — skips the whole settings pass, so nothing is examined and
// nothing is removed. Reporting `true` there would have `update-engine` announce "your
// own status line is back" to an owner whose settings were never opened: an unverified
// outcome stated in the measured voice, which is the one failure mode this release is
// otherwise busy closing.
test("reconcileBrain — with no settings template to read, the retreat is not CLAIMED", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource(); // deliberately carries no .claude/settings.json.template
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const settingsPath = join(brainDir, ".claude/settings.json");
  const before = readFileSync(settingsPath, "utf8");

  const report = await reconcile({
    brainDir, platform: "posix", sourceDir, target: manifest(), local: manifest({ ragVersion: "1.0.0" }), ...seams(),
  });

  assert.equal(report.statusLineRemoved, false, "nothing was examined, so nothing may be claimed");
  assert.deepEqual(report.hooksAdded, [], "and no hook was wired either");
  assert.equal(readFileSync(settingsPath, "utf8"), before, "the sacred file is untouched");
});

// ═══════════════════════════════════════════════════════════════════════════
// The fleet migration: un-ignore the active-universe pointer (ADR 0034).
// A brain's `.gitignore` is carried by NO engine regime, so the launcher's own
// change reaches nobody. The reconciler is the one path that does — it runs at
// every update AND at every SessionStart self-heal, and it is idempotent.
// ═══════════════════════════════════════════════════════════════════════════

const STALE_IGNORE_BLOCK = [
  "# Universes (ADR 0034): the active-universe pointer is per-machine session state",
  "# (never commit it). Its sibling .vault-rag/universes.json registry IS committed on",
  "# purpose (structural: which universes exist) — only the pointer is transient.",
  ".vault-rag/active-universe",
].join("\n");

test("reconcileBrain — a deployed brain stops ignoring its universe pointer, and its own entries survive", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  t.after(() => rmSync(sourceDir, { recursive: true, force: true }));
  writeFile(brainDir, ".gitignore", `.env\n${STALE_IGNORE_BLOCK}\n# mine\nscratch/\n`);
  const before = {};
  for (const rel of Object.keys(SACRED)) before[rel] = sha256(join(brainDir, rel));

  const report = await reconcile({
    brainDir,
    platform: "darwin",
    sourceDir,
    target: manifest(),
    local: manifest(),
    ...seams(),
  });

  const gitignore = readFileSync(join(brainDir, ".gitignore"), "utf8");
  assert.equal(report.pointerUnignored, true, "the report must say the fleet migration ran");
  assert.doesNotMatch(gitignore, /^\.vault-rag\/active-universe$/m);
  assert.match(gitignore, /^scratch\/$/m, "the owner's own entries are untouched");
  assert.match(gitignore, /^# mine$/m, "including their own comments");
  assert.match(gitignore, /^\.env$/m, "and the secrets they must keep ignoring");
  assertSacredUntouched(brainDir, before);
});

test("reconcileBrain — a brain already migrated is not touched again, and does not claim it was", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  t.after(() => rmSync(sourceDir, { recursive: true, force: true }));
  writeFile(brainDir, ".gitignore", ".env\nscratch/\n");
  const args = {
    brainDir,
    platform: "darwin",
    sourceDir,
    target: manifest(),
    local: manifest(),
    ...seams(),
  };

  const report = await reconcile(args);

  assert.equal(report.pointerUnignored, false, "nothing to migrate must not read as a migration");
  assert.equal(readFileSync(join(brainDir, ".gitignore"), "utf8"), ".env\nscratch/\n");
});

test("reconcileBrain — a brain with no .gitignore at all migrates nothing, and never creates one", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  t.after(() => rmSync(sourceDir, { recursive: true, force: true }));

  const report = await reconcile({
    brainDir,
    platform: "darwin",
    sourceDir,
    target: manifest(),
    local: manifest(),
    ...seams(),
  });

  assert.equal(report.pointerUnignored, false);
  assert.equal(existsSync(join(brainDir, ".gitignore")), false, "we write files, we do not invent them");
});

// ═══════════════════════════════════════════════════════════════════════════
// S6c — THE RETIREMENT, wired. The engine's surface is additive by construction
// (ADR 0025); this is the one declared, provenance-guarded exception (ADR 0039).
// The decision and the `rmSync` live next door; what is asserted here is that the
// reconcile CALLS them, with the brain's own provenance, at the right moment.
// ═══════════════════════════════════════════════════════════════════════════

test("reconcileBrain — a RETIRED skill the owner never touched is deleted, and named in the report", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const shipped = "---\nname: tdd-discipline\n---\nOne test at a time.\n";
  writeFile(brainDir, ".claude/skills/tdd-discipline/SKILL.md", shipped);
  // The manifest change is ONE change, and this fixture is what it looks like: the
  // tombstone is declared and the `merge` entry is gone in the same breath. Doing only
  // the first would have the update delete the directory and SessionStart restore it.
  const target = manifest({ retired: [".claude/skills/tdd-discipline/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0" }),
    provenance: { ".claude/skills/tdd-discipline/SKILL.md": base(shipped) },
  };

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.deepEqual(report.skillsRetired, ["tdd-discipline"]);
  assert.deepEqual(report.skillsRetirePreserved, []);
  assert.equal(existsSync(join(brainDir, ".claude/skills/tdd-discipline")), false, "gone from the disk");
});

// THE PROVENANCE HAS TO BE THE BRAIN'S OWN. Handing the FETCHED manifest's provenance
// here would compare the owner's file against what the new engine says it ships — and
// on a brain that edited the skill, that comparison can accidentally succeed. The
// question is "did WE deliver these exact bytes to YOU?", and only the local manifest
// can answer it.
test("reconcileBrain — a RETIRED skill the owner edited is kept, and the report says which file blocked it", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const mine = "---\nname: tdd-discipline\n---\nOne test at a time. AND MY OWN NOTES.\n";
  writeFile(brainDir, ".claude/skills/tdd-discipline/SKILL.md", mine);
  const target = manifest({ retired: [".claude/skills/tdd-discipline/**"] });
  const local = {
    ...manifest({ ragVersion: "1.0.0" }),
    provenance: { ".claude/skills/tdd-discipline/SKILL.md": base("---\nname: tdd-discipline\n---\nOne test at a time.\n") },
  };

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.deepEqual(report.skillsRetired, []);
  assert.deepEqual(report.skillsRetirePreserved, [
    { name: "tdd-discipline", blockers: [{ rel: ".claude/skills/tdd-discipline/SKILL.md", reason: "customized" }] },
  ]);
  assert.equal(readFileSync(join(brainDir, ".claude/skills/tdd-discipline/SKILL.md"), "utf8"), mine);
});

// F3 (v5.0.0 code review) — and the reconcile's own half of it: the SELF-HEAL must not
// retire. It is spawned detached with `stdio: "ignore"`, so anything it reports is thrown
// away by construction — a deletion decided here is a deletion nobody can ever be told
// about. Asserted through the reconciler and not only through the retirement module,
// because what F3 actually was is a MISSING ARGUMENT at this call site.
test("reconcileBrain — a self-heal retires NOTHING, so a restored skill survives the next session start", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const shipped = "---\nname: tdd-discipline\n---\nOne test at a time.\n";
  // The owner went and got it back out of their git history — so it is byte-identical to
  // what the engine once delivered, and the recorded provenance still proves it. Every
  // condition for a deletion is met except the one that matters.
  writeFile(brainDir, ".claude/skills/tdd-discipline/SKILL.md", shipped);
  const local = {
    ...manifest({ retired: [".claude/skills/tdd-discipline/**"] }),
    provenance: { ".claude/skills/tdd-discipline/SKILL.md": base(shipped) },
  };

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir: brainDir, target: local, local, ...s });

  assert.deepEqual(report.skillsRetired, []);
  assert.deepEqual(report.skillsRetirePreserved, []);
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/tdd-discipline/SKILL.md"), "utf8"),
    shipped,
    "a self-heal may not delete what the owner put back — and it could never have said so",
  );
});

// ⏱️ THE ORDER, and it is observable only through a manifest the design forbids: one
// that both DECLARES the skill `merge` and retires it. The engine must not spend an
// update carefully three-way-merging a directory it is about to delete — and a brain
// whose manifest is half-edited (or fetched mid-release) is exactly where that happens.
test("reconcileBrain — the retirement runs BEFORE the refresh: no skill is merged on its way to the bin", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const shipped = "---\nname: tdd-discipline\n---\nOne test at a time.\n";
  writeFile(brainDir, ".claude/skills/tdd-discipline/SKILL.md", shipped);
  writeFile(sourceDir, ".claude/skills/tdd-discipline/SKILL.md", shipped + "a line the refresh would deliver\n");
  const target = manifest({
    extraMerge: [".claude/skills/tdd-discipline/**"],   // still declared…
    retired: [".claude/skills/tdd-discipline/**"],      // …and retired in the same manifest
  });
  const local = {
    ...manifest({ ragVersion: "1.0.0", extraMerge: [".claude/skills/tdd-discipline/**"] }),
    provenance: { ".claude/skills/tdd-discipline/SKILL.md": base(shipped) },
  };

  const { calls, ...s } = seams();
  const report = await reconcile({ brainDir, platform: "posix", sourceDir, target, local, ...s });

  assert.deepEqual(report.skillsRetired, ["tdd-discipline"]);
  assert.deepEqual(report.skillsRefreshed, [], "nothing was refreshed on its way out");
  assert.equal(existsSync(join(brainDir, ".claude/skills/tdd-discipline")), false);
});

// The state of every brain in the fleet today, and of every one that never held the
// skill: the report's two new lists exist and are empty, so the reporting layer has
// nothing to say rather than something empty to say.
test("reconcileBrain — no tombstone declared: the retirement lists are present and empty", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const { calls, ...s } = seams();
  const report = await reconcile({
    brainDir, platform: "posix", sourceDir,
    target: manifest(), local: manifest({ ragVersion: "1.0.0" }), ...s,
  });
  assert.deepEqual(report.skillsRetired, []);
  assert.deepEqual(report.skillsRetirePreserved, []);
});

// ═══════════════════════════════════════════════════════════════════════════
// S7-3 — THE HEAL, WIRED. Everything above this block is a brain that RECORDED a
// provenance at install. The whole deployed fleet did not: `CLAUDE.engine.md` was in
// no regime at any published tag, so `mergeVerdict` short-circuits on `!recorded` and
// answers `preserve/no-provenance` — forever, for everybody.
//
// S7-1 built the proof (`healProvenance`), S7-2 the table it recognises bytes in.
// This is the wiring that makes a real update consult them, and the four tests below
// are the acceptance of the whole S7 arc: a brain that recorded NOTHING receives.
// ═══════════════════════════════════════════════════════════════════════════

const FINGERPRINTS = "scripts/lib/engine-fingerprints.json";

// A table that recognises `content` at `rel` — written the long way rather than through
// the generator, so a defect in the generator cannot make these tests pass.
function tableFor(rel, content, since = "v3.6.0", locale = "en") {
  return JSON.stringify({ generatedAt: "v5.0.0", files: { [rel]: { [base(content)]: { since, locale } } } });
}

test("reconcileBrain — a brain that recorded NOTHING receives the doctrine, because its bytes are recognised", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const shipped = "# Engine doctrine\nAs v3.6.0 shipped it.\n";
  const improved = shipped + "\nJamais de `- [ ]` muet.\n";
  writeFile(brainDir, "CLAUDE.engine.md", shipped);
  writeFile(sourceDir, "CLAUDE.engine.md", improved);
  writeFile(sourceDir, FINGERPRINTS, tableFor("CLAUDE.engine.md", shipped));

  const report = await reconcile({
    brainDir,
    platform: "posix",
    sourceDir,
    target: manifest({ extraMerge: ["CLAUDE.engine.md"] }),
    local: { provenance: {} }, // the frozen fleet: not one recorded sha
    ...seams(),
  });

  assert.deepEqual(report.doctrineRefreshed, ["CLAUDE.engine.md"], "delivered, not preserved");
  assert.deepEqual(report.doctrinePreserved, []);
  assert.equal(readFileSync(join(brainDir, "CLAUDE.engine.md"), "utf8"), improved);
  assert.deepEqual(report.healed, [{ rel: "CLAUDE.engine.md", since: "v3.6.0", locale: "en" }]);
});

test("reconcileBrain — the same brain WITHOUT the table stays frozen, and says so", async (t) => {
  // The control for the test above: same brain, same source, no table. If this ever
  // goes green the delivery is coming from somewhere other than the heal.
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const shipped = "# Engine doctrine\nAs v3.6.0 shipped it.\n";
  writeFile(brainDir, "CLAUDE.engine.md", shipped);
  writeFile(sourceDir, "CLAUDE.engine.md", shipped + "\nsomething new\n");

  const report = await reconcile({
    brainDir,
    platform: "posix",
    sourceDir,
    target: manifest({ extraMerge: ["CLAUDE.engine.md"] }),
    local: { provenance: {} },
    ...seams(),
  });

  assert.deepEqual(report.doctrineRefreshed, []);
  assert.deepEqual(
    report.doctrinePreserved,
    [{ name: "CLAUDE.engine.md", reason: "no-provenance", newVersionPath: "CLAUDE.engine.md.new" }],
    "and the REASON is the freeze itself — the state of the whole fleet before S7",
  );
  assert.deepEqual(report.healed, []);
  assert.equal(readFileSync(join(brainDir, "CLAUDE.engine.md"), "utf8"), shipped, "untouched");
});

test("reconcileBrain — a doctrine the OWNER edited is recognised by nothing, and is preserved", async (t) => {
  // The asymmetric risk the whole design is built against: a heal that fired here
  // would let the update overwrite the owner's own paragraph.
  const brainDir = buildBrain();
  const sourceDir = buildSource();
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const shipped = "# Engine doctrine\nAs v3.6.0 shipped it.\n";
  const theirs = shipped + "\nMy own rule, which I wrote myself.\n";
  writeFile(brainDir, "CLAUDE.engine.md", theirs);
  writeFile(sourceDir, "CLAUDE.engine.md", shipped + "\nJamais de `- [ ]` muet.\n");
  writeFile(sourceDir, FINGERPRINTS, tableFor("CLAUDE.engine.md", shipped));

  const report = await reconcile({
    brainDir,
    platform: "posix",
    sourceDir,
    target: manifest({ extraMerge: ["CLAUDE.engine.md"] }),
    local: { provenance: {} },
    ...seams(),
  });

  assert.deepEqual(report.healed, []);
  assert.deepEqual(
    report.doctrinePreserved,
    [{ name: "CLAUDE.engine.md", reason: "no-provenance", newVersionPath: "CLAUDE.engine.md.new" }],
    "still no-provenance: the table proves nothing about bytes it does not carry",
  );
  assert.equal(readFileSync(join(brainDir, "CLAUDE.engine.md"), "utf8"), theirs, "their words, untouched");
});

test("runReconcileCli — a SELF-HEAL that delivers nothing still RECORDS the proof it found", async (t) => {
  // 🚨 The clause this pins, and it would have been silently false: the manifest write
  // is guarded on "something was delivered", and a self-heal delivers nothing (all three
  // refresh families are gated on sourceDir !== brainDir). Without widening that guard
  // the heal is computed, used for one run, and thrown away — so the NEXT update finds
  // the same frozen brain and the self-heal never converges anything.
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const shipped = "# Engine doctrine\nAs v3.6.0 shipped it.\n";
  writeFile(brainDir, "CLAUDE.engine.md", shipped);
  writeFile(brainDir, FINGERPRINTS, tableFor("CLAUDE.engine.md", shipped));
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify({ ...manifest({ extraMerge: ["CLAUDE.engine.md"] }), provenance: {} }, null, 2),
  );

  const runReconcileCli = await loadCli();
  const report = await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", brainDir, "--platform", "posix"],
    seams: seams(),
  });

  assert.deepEqual(report.healed, [{ rel: "CLAUDE.engine.md", since: "v3.6.0", locale: "en" }]);
  const persisted = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(
    persisted.provenance["CLAUDE.engine.md"],
    base(shipped),
    "the proof is on disk, so the NEXT update can merge",
  );
  assert.equal(persisted.baseRefs["CLAUDE.engine.md"], "v3.6.0", "and it learned which version, for free");
});

test("runReconcileCli — a learned baseRef never overwrites one the brain already recorded", async (t) => {
  const brainDir = buildBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const shipped = "# Engine doctrine\nAs v3.6.0 shipped it.\n";
  writeFile(brainDir, "CLAUDE.engine.md", shipped);
  writeFile(brainDir, FINGERPRINTS, tableFor("CLAUDE.engine.md", shipped));
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        ...manifest({ extraMerge: ["CLAUDE.engine.md"] }),
        provenance: {},
        baseRefs: { "CLAUDE.engine.md": "v4.9.1" },
      },
      null,
      2,
    ),
  );

  const runReconcileCli = await loadCli();
  await runReconcileCli({
    argv: ["--brainDir", brainDir, "--sourceDir", brainDir, "--platform", "posix"],
    seams: seams(),
  });

  const persisted = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(persisted.baseRefs["CLAUDE.engine.md"], "v4.9.1", "the record wins over what was learned");
});
