// ─────────────────────────────────────────────────────────────────────────────
// reconcile-brain.mjs — the RECONCILE half of update-engine (ADR 0026). Makes the
// brain's on-disk engine state MATCH a desired-state `target` manifest, deterministic
// and idempotent: copy the engine files, install-if-absent the engine-declared skills,
// reconcile `.mcp.json` against `engineMcpServers`, add-if-absent the engine-owned
// SessionStart hook entries into `settings.json`, regenerate the launchers, run install,
// and reindex IFF the index schema moved. It NEVER touches the vault, `.env`, the
// constitution, user-added `.mcp.json` servers, user-authored `settings.json` entries or
// any non-declared / custom skill (the write-allowlist safety core is `computeApplyPlan`;
// the `.mcp.json` and hook-entry merges are additive side-channels OUTSIDE it — ADR 0026).
//
// Why standalone (ADR 0026): the same reconciler runs at TWO points —
//   • auto-finalize: re-exec'd as a fresh child process at the end of update-engine,
//     so the JUST-INSTALLED converge logic runs in one invocation (kills the 2-cycle);
//   • SessionStart self-heal: a brain that received code but never reconciled converges
//     silently at the next session start.
// It takes a `sourceDir` (the files to converge FROM) + the four I/O seams, so it runs
// offline. It does NOT fetch and does NOT record the engine version — those are
// update-engine's fetch-result concerns (step 7).
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

import { isEntrypoint } from "./entrypoint.mjs";
import { computeApplyPlan } from "./engine-apply-plan.mjs";
import { matchesAny } from "./glob-match.mjs";
import { installStagedSkills, readStagedProvenance } from "./staged-skills.mjs";
import { refreshUntouchedSkills } from "./engine-skill-refresh.mjs";
import { seedHealthNote } from "./staged-health-note.mjs";
import { reconcileMcpServers } from "./mcp-reconcile.mjs";
import { reconcileHooks, repairEngineHookCommands, repairWin32NodePrefix } from "./hooks-reconcile.mjs";
import { needsReindex } from "./reindex-trigger.mjs";
import { reseedProvenance } from "./engine-source.mjs";
import { listFilesRelPosix } from "./fs-walk.mjs";
import { selectEngineFilesToCopy } from "./engine-copy-select.mjs";
import {
  defaultRunInstall,
  defaultRunReindex,
  defaultCountVaultNotes,
  defaultRegenerateLaunchers,
} from "./engine-seams.mjs";

// Copies `rel` from srcDir into destDir. Returns true if it copied, false if it
// SKIPPED a self-copy: in SessionStart self-heal mode srcDir === brainDir, so a file
// would be copied onto itself — on Linux `copyFileSync(f, f)` truncates the dest before
// copying (it would zero the engine file; ADR 0015 cross-platform safety). Skip it.
// `{{PROJECT_ROOT}}` is substituted POSIX-normalised (cf. installer toPosix): the brain
// dir reaches templates as `C:/Users/...`, never `C:\Users\...`, because the values land
// in hook commands Git Bash also has to run — a backslash there is eaten (issue #31).
// Exported so the win32 contract is verifiable on a POSIX CI, where the transform is
// otherwise a no-op and any regression in it would be invisible.
export const toPosix = (p) => p.split("\\").join("/");

function copyInto(srcDir, destDir, rel) {
  const src = join(srcDir, rel);
  const dest = join(destDir, rel);
  if (resolve(src) === resolve(dest)) return false;
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  return true;
}

export async function reconcileBrain({
  brainDir,
  platform = process.platform,
  sourceDir,
  target,
  local,
  regenerateLaunchers,
  runInstall,
  runReindex,
  countVaultNotes,
}) {
  // 1. The write-allowlist (the safety core, Step 3): the ONLY files we may write.
  const plan = computeApplyPlan(target);

  // 2. Apply the COPY buckets — overwrite (`replace`) + the engine-owned scripts
  //    (incl. update-engine.mjs → self-update). Globs are resolved against the files
  //    the source actually carries, then refined by `selectEngineFilesToCopy` with the
  //    SAME two exclusions the INSTALLER applies (PR #10 QA findings): F1 drops the
  //    dev-only files (scripts/lib/eval-*/mcp-search.*), F2 keeps the brain's
  //    locale-owned files (scripts/lib/demo-locale.mjs → no fr→en regression).
  const sourceFiles = listFilesRelPosix(sourceDir);
  // ⚠️ BEFORE the copy: the brain's own `engine-skills/` copy is the provenance base of
  // the STAGED skills (Increment 2.5), and `engine-skills/**` is a `replace` glob — one
  // line later it holds the NEW content and every staged skill would read as untouched.
  const stagedProvenance = readStagedProvenance(brainDir);
  const copyGlobs = [...plan.overwrite, ...plan.replaceScripts];
  const copied = [];
  for (const rel of selectEngineFilesToCopy({ sourceFiles, copyGlobs })) {
    if (copyInto(sourceDir, brainDir, rel)) copied.push(rel);
  }

  // 2.bis Install engine-declared skills the brain is MISSING (ADR 0025): additive,
  //    install-if-absent at the SKILL-DIR level. A skill dir that already exists
  //    (possibly user-customized) is left byte-identical; a brand-new engine skill is
  //    copied in. Non-declared / custom skills are never in `installSkills` → untouchable.
  const installedSkills = [];
  // What install-if-absent WRITES is engine-delivered content, so it needs a provenance
  // base like any other delivered merge file. Without it the freshly-installed skill
  // reads `no-provenance` at every later update and is frozen forever — the very freeze
  // this increment removes, re-entering by the install-if-absent door.
  const installedFileMap = {};
  for (const skillGlob of plan.installSkills) {
    const skillDir = skillGlob.replace(/\/\*\*?$/, ""); // ".../local-mirror/**" → ".../local-mirror"
    if (existsSync(join(brainDir, skillDir))) continue; // present → preserve, never overwrite
    for (const rel of sourceFiles.filter((f) => matchesAny([skillGlob], f))) {
      if (copyInto(sourceDir, brainDir, rel)) installedFileMap[rel] = readFileSync(join(brainDir, rel), "utf8");
    }
    installedSkills.push(skillDir.split("/").pop()); // the skill name, for the report
  }

  // 2.bis-staged Install STAGED engine skills (F-B7 2d, ADR 0026): a new upgrader-bound
  //    skill (local-mirror) can't ride in under `.claude/skills/` (the sacred scrub forbids
  //    it), so its source ships at the NON-sacred `engine-skills/<name>/` path (a `replace`
  //    file → pass-1 delivers it). install-if-absent each into `.claude/skills/<name>/`,
  //    alongside the merge-skill install above; fold the names into the same report.
  installedSkills.push(...installStagedSkills({ sourceDir, brainDir }));

  // 2.bis-refresh REFRESH the engine skills the brain has NOT touched (Increment 2.5).
  //    install-if-absent above stops at the skill-DIR level, so an already-present skill
  //    was frozen forever: 12 skill commits since v3.2.2 reached nobody, while their
  //    deterministic cores (a `replace` glob) were refreshed → live core/skill drift.
  //    Here we overwrite ONLY what the sha256 provenance base proves byte-identical to
  //    what the engine last delivered; a customized skill is preserved and reported.
  //    ⚠️ Guarded on `sourceDir !== brainDir`: a skill is only ever overwritten during an
  //    update the owner explicitly asked for (auto-finalize hands us the FETCHED source),
  //    NEVER at SessionStart self-heal (which passes the brain as its own source — no new
  //    content, and nobody asked). ADR 0026's "additive" invariant holds where it matters.
  const { skillsRefreshed, skillsPreserved, refreshedFileMap } = refreshUntouchedSkills({
    brainDir,
    sourceDir,
    sourceFiles,
    manifest: target,
    // The two families of base, in one map keyed by the INSTALLED path: the manifest's
    // recorded sha256 for the `merge` skills, the pre-copy staging tree for the staged
    // ones. They can never collide — a staged skill is, by construction, not a merge file.
    provenance: { ...(local?.provenance ?? {}), ...stagedProvenance },
  });

  // 2.ter Reconcile .mcp.json against the engine's MCP servers (ADR 0025): register a
  //    newly-shipped engine server the brain is MISSING, taking its definition from the
  //    source's .mcp.json.template with {{PROJECT_ROOT}} substituted to this brain dir.
  //    The set of engine servers is derived from the DELIVERED template's keys (F-B7 2e) —
  //    NOT the frozen `manifest.engineMcpServers`, which update-engine never refreshes (the
  //    root cause of the pre-3.3.0 non-convergence). Existing servers (engine OR user-added)
  //    are preserved.
  const templatePath = join(sourceDir, ".mcp.json.template");
  const brainMcpPath = join(brainDir, ".mcp.json");
  const mcpServersAdded = [];
  if (existsSync(templatePath) && existsSync(brainMcpPath)) {
    const projectRoot = toPosix(brainDir);
    const templateMcp = JSON.parse(readFileSync(templatePath, "utf8").split("{{PROJECT_ROOT}}").join(projectRoot));
    const engineServerIds = Object.keys(templateMcp.mcpServers ?? {}); // desired-state = delivered template keys
    const brainMcp = JSON.parse(readFileSync(brainMcpPath, "utf8"));
    const before = new Set(Object.keys(brainMcp.mcpServers ?? {}));
    const reconciled = reconcileMcpServers({ brainMcp, templateMcp, engineServerIds });
    writeFileSync(brainMcpPath, JSON.stringify(reconciled, null, 2) + "\n");
    mcpServersAdded.push(...Object.keys(reconciled.mcpServers).filter((id) => !before.has(id)));
  }

  // 2.quinquies Reconcile settings.json HOOK ENTRIES against the source's
  //    settings.json.template (ADR 0026): the THIRD additive surface, twin of the
  //    .mcp.json reconcile (2.ter). settings.json is SACRED to the write-allowlist
  //    (`computeApplyPlan` never lists it), so this is a surgical SIDE-CHANNEL: the ONLY
  //    write the reconciler ever makes to it, and purely ADDITIVE — wire the engine-owned
  //    hook entries the brain is MISSING (e.g. a v3.1.0 brain that never got
  //    session-self-heal / session-health / session-obsidian-hint), dedup by the engine
  //    script each hook runs, with the brain's OWN node interpreter + dir substituted into
  //    the template placeholders. Never overwrite, never remove, never touch a user entry;
  //    WRITE ONLY when something is actually added → a converged brain is byte-identical
  //    (no auto-commit churn). settings.json.template is itself an engine-delivered file
  //    (`replace` regime), so a brain that received the engine code CARRIES it — which means
  //    self-heal (sourceDir === brainDir) reads the brain's OWN template and DOES wire the
  //    hooks. That is exactly how a pre-3.2 brain converges at the next restart: the
  //    session-status bootstrap tick spawns this reconcile in self-heal mode (no 2nd update
  //    needed). Upgraders from v3.3.0+ converge the same way in-band via auto-finalize.
  const hooksAdded = [];
  const hooksRepaired = [];
  const settingsTemplatePath = join(sourceDir, ".claude", "settings.json.template");
  const brainSettingsPath = join(brainDir, ".claude", "settings.json");
  if (existsSync(settingsTemplatePath) && existsSync(brainSettingsPath)) {
    const projectRoot = toPosix(brainDir); // same normalisation as step 2.ter
    const brainSettings = JSON.parse(readFileSync(brainSettingsPath, "utf8"));
    const templateSettings = JSON.parse(readFileSync(settingsTemplatePath, "utf8"));
    const { hooks: addedHooks, hooksAdded: added } = reconcileHooks({
      brainHooks: brainSettings.hooks ?? {},
      templateHooks: templateSettings.hooks ?? {},
      projectRoot,
    });
    // Issue #31: heal the broken `cmd /c "…\run-node.cmd"` prefix that pre-fix
    // Windows brains baked into every hook — AND into the top-level statusLine
    // command — which Git Bash eats (`claude`→`laude`). Narrow, in-place, idempotent
    // (a no-op on posix and on already-fixed brains), so a converged brain stays
    // byte-identical and the deployed fleet self-heals at the next restart's reconcile.
    const { hooks: healedHooks, repaired } = repairEngineHookCommands({ hooks: addedHooks, platform, projectRoot });
    const healedStatusLine = brainSettings.statusLine?.command
      ? repairWin32NodePrefix(brainSettings.statusLine.command, projectRoot)
      : brainSettings.statusLine?.command;
    const statusLineRepaired = healedStatusLine !== brainSettings.statusLine?.command;
    if (added.length > 0 || repaired.length > 0 || statusLineRepaired) {
      const nextSettings = { ...brainSettings, hooks: healedHooks };
      if (statusLineRepaired) nextSettings.statusLine = { ...brainSettings.statusLine, command: healedStatusLine };
      writeFileSync(brainSettingsPath, JSON.stringify(nextSettings, null, 2) + "\n");
      hooksAdded.push(...added);
      hooksRepaired.push(...repaired, ...(statusLineRepaired ? ["statusLine"] : []));
    }
  }

  // 2.quater Ensure the engine-owned health-check note is present AND indexed (ADR 0026
  //    amended): the ONE narrow, nominative carve-out to the vault-sacred invariant. The
  //    note's runtime home `vault/engine-health/health-check.md` is SACRED, so its source
  //    ships at the NON-sacred staged path `engine-health/health-check.md` (a `replace`
  //    file the engine DELIVERS); `seedHealthNote` write-if-absent's it into the vault from
  //    that staged copy — NEVER overwrite, NEVER delete, NEVER any other vault path. This
  //    converges in BOTH update (sourceDir !== brainDir) AND self-heal (sourceDir ===
  //    brainDir, the staged copy is on the brain's own disk) modes — the F-B7b fix: a
  //    pre-3.3.0 upgrader, whose old in-process update neither seeds nor auto-finalizes,
  //    finally gets the canary at the restart's self-heal. We key the index pairing (step 5)
  //    off the note's ON-DISK PRESENCE, not a one-shot "just copied" flag: if a prior run
  //    seeded the note but crashed before indexing it (flaky npm / ABI hiccup), the next run
  //    still finds it present-but-maybe-unindexed and re-pairs the (cheap, incremental)
  //    reindex → the canary can never become a permanent false `broken` (finding #6).
  const { present: healthNotePresent } = seedHealthNote({ sourceDir, brainDir });

  // 3. Regenerate the launchers (both halves, ADR 0015).
  const regenerated = plan.regenerate.length > 0;
  if (regenerated) await regenerateLaunchers({ brainDir, platform });

  // 4. npm install in the brain's rag/ (+ local-mirror/ when present).
  await runInstall({ ragDir: join(brainDir, "rag"), brainDir, platform });

  // 5. Reindex IFF the index schema moved (a FULL re-encode of every note) OR an
  //    upgrader's health-check note is present (a cheap INCREMENTAL pass — the
  //    index-manager skips every already-indexed note via its content-hash cache, so a
  //    re-run where the note is already in the index is a fast no-op, while a seeded-but-
  //    unindexed note finally gets encoded). The index is its OWN membership oracle, so no
  //    separate "indexed" marker can drift. ⚠️ Mandatory pairing (ADR 0026, decision B): a
  //    present-but-unindexed note → 0 index hits → a FALSE `broken` from `health_check`.
  //    `reindexReason` keeps the report honest: a schema move re-encodes everything; the
  //    health pairing does not.
  const schemaMoved = needsReindex({ local, target });
  const reindexReason = schemaMoved ? "schema" : healthNotePresent ? "health-note-seed" : null;
  const reindexed = reindexReason !== null;
  if (reindexed) await runReindex({ brainDir, platform, mode: schemaMoved ? "full" : "incremental" });

  // 6. Count the notes the brain holds, for the user-facing recap (F2). Read after
  //    any reindex so it reflects the current vault.
  const vaultNoteCount = await countVaultNotes({ brainDir });

  return {
    copied,
    regenerated,
    reindexed,
    reindexReason,
    vaultNoteCount,
    installedSkills,
    installedFileMap,
    skillsRefreshed,
    skillsPreserved,
    refreshedFileMap,
    mcpServersAdded,
    hooksAdded,
    hooksRepaired,
  };
}

// ── CLI entry — what the auto-finalize child process runs (ADR 0026, Layer A) ──
// Parses `--brainDir <dir> --sourceDir <dir> [--platform <p>]` and converges the brain
// from the fetched source, using the brain's OWN (just-updated) manifest as BOTH target
// and local → schema is unchanged from its own viewpoint, so the child never reindexes
// (it converges files; it does not migrate). RECONCILE ONLY: no fetch, no auto-finalize
// → no recursion. `seams` is injectable for tests; defaults are the real I/O seams.
// A flag in LAST position carries no value: reading past the end already yields
// `undefined`, so no length guard is needed — one would be unable to change a single
// byte of the result (mutation lesson: a guard that cannot matter says the same in less
// code). The `i >= 0` check, on the other hand, is load-bearing: without it an ABSENT
// flag would read `argv[0]` and hand back the first argument as its value.
function flagValue(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export async function runReconcileCli({ argv, seams = {} }) {
  const brainDir = flagValue(argv, "--brainDir");
  const sourceDir = flagValue(argv, "--sourceDir");
  const platform = flagValue(argv, "--platform") ?? process.platform;
  if (!brainDir || !sourceDir) {
    throw new Error("reconcile-brain: --brainDir and --sourceDir are required");
  }
  const manifestPath = join(brainDir, "engine-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const report = await reconcileBrain({
    brainDir,
    platform,
    sourceDir,
    target: manifest,
    local: manifest, // same manifest → needsReindex is false → converge without migrating
    regenerateLaunchers: seams.regenerateLaunchers ?? defaultRegenerateLaunchers,
    runInstall: seams.runInstall ?? defaultRunInstall,
    runReindex: seams.runReindex ?? defaultRunReindex,
    countVaultNotes: seams.countVaultNotes ?? defaultCountVaultNotes,
  });

  // T1 — re-seed the provenance base of the skills we just refreshed. The child is the
  // LAST writer of the brain's manifest on the update path (the parent's step 7 already
  // ran, and on the first update carrying this feature the parent runs the OLD code, so
  // the refresh happens HERE). Without this, a refreshed file no longer matches its
  // recorded base → the next update calls it "user-modified" and never refreshes it
  // again: the feature would work exactly once per brain, silently.
  const delivered = { ...report.installedFileMap, ...report.refreshedFileMap };
  if (Object.keys(delivered).length > 0) {
    const provenance = reseedProvenance({
      priorProvenance: manifest.provenance ?? {},
      manifest,
      deliveredFileMap: delivered,
    });
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, provenance }, null, 2) + "\n");
  }
  return report;
}

// The real I/O the child process runs on: the flags it was actually launched with and
// the real stderr. Everything `runReconcileCliProcess` decides is testable BECAUSE it is
// handed these instead of reaching for them (the `clear-example-notes` idiom, twin of
// update-engine's `realUpdateDeps`) — the entry-point block below is now pure wiring.
export const realReconcileDeps = {
  argv: process.argv.slice(2),
  runReconcileCli,
  error: (s) => process.stderr.write(s),
};

// What the auto-finalize child process does, minus the process. Returns the exit code.
// FAIL LOUD on error (exit 1) — auto-finalize's own caller treats a child failure as
// best-effort (fail-soft there), so this banner is the ONLY trace a broken reconcile
// leaves behind. `?? e` catches a thrown non-Error (a bare string); `?? "no reason
// given"` catches a rejection with no reason at all — a ❌ over an empty line tells
// nobody anything.
export async function runReconcileCliProcess(deps = realReconcileDeps) {
  try {
    await deps.runReconcileCli({ argv: deps.argv });
    return 0;
  } catch (e) {
    deps.error(`\n❌ reconcile-brain failed.\n${e?.message ?? e ?? "no reason given"}\n`);
    return 1;
  }
}

// ── CLI entry ────────────────────────────────────────────────────────────────
// Guarded so importing this module never runs the CLI. Through the canonical
// `isEntrypoint` (bug B2): a hand-rolled path/URL comparison silently never matches on
// Windows paths or paths carrying a space, and a guard that never fires makes the whole
// command an inert no-op that says nothing about it.
if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(await runReconcileCliProcess());
}
