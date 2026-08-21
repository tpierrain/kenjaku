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
import { retireDeclaredSkills } from "./skill-retirement-fs.mjs";
import { refreshEngineScripts } from "./engine-script-refresh.mjs";
import { refreshEngineDoctrine } from "./engine-doctrine-refresh.mjs";
import { seedHealthNote } from "./staged-health-note.mjs";
import { reconcileMcpServers } from "./mcp-reconcile.mjs";
import { reconcileHooks, repairEngineHookCommands, repairWin32NodePrefix } from "./hooks-reconcile.mjs";
import { withoutEngineStatusLine } from "./status-line-retreat.mjs";
import { needsReindex } from "./reindex-trigger.mjs";
import { unignoreActiveUniverse } from "./unignore-pointer.mjs";
import { reseedBaseRefs, reseedProvenance } from "./engine-source.mjs";
import { syncBaseTree, readBaseTree, readInstalledMergeFiles } from "./engine-base-fs.mjs";
import { healFromDisk, readFingerprintTable } from "./engine-heal-fs.mjs";
import { planAncestorFetch } from "./engine-ancestor.mjs";
import { fetchAncestors } from "./engine-ancestor-fetch.mjs";
import { defaultGit } from "./engine-fetch.mjs";
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
  // S7-5-3: the seam the ancestor fetch spawns git through. Same runner as the update
  // CHECK and as auto-push, because two spellings of "ask git" would be two behaviours
  // to keep in step forever.
  git = defaultGit,
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
  // ⚠️ ALSO BEFORE the copy, and computed exactly ONCE: THE HEAL (plan S7-3). The whole
  // deployed fleet recorded no provenance for `CLAUDE.engine.md` — it was in no regime at
  // any published tag — so `mergeVerdict` short-circuits on `!recorded` and answers
  // `preserve/no-provenance` forever. The ancestor's bytes are on the disk; only the PROOF
  // was missing, and a table of every version the engine ever published supplies it.
  //
  // The seam is the `recorded` INPUT and nothing below it: hand the three refresh families
  // a provenance the brain can PROVE, and `verifyBase`, `mergeVerdict`, `planBaseSeed` and
  // `planBaseAdvance` do the right thing untouched. Computing it here rather than at the
  // seed also removes the crux the design named: one fact, one owner, one write.
  //
  // Read ONCE, used TWICE: the heal and the ancestor fetch below need the same installed
  // bytes and the same table, and this path runs at every session start.
  const installedMergeFiles = readInstalledMergeFiles({ brainDir, manifest: target });
  const fingerprintTable = readFingerprintTable({ sourceDir, brainDir });
  const { provenance: healedProvenance, baseRefs: healedBaseRefs, healed } = healFromDisk({
    manifest: target,
    provenance: local?.provenance ?? {},
    sourceDir,
    brainDir,
    installedFileMap: installedMergeFiles,
    table: fingerprintTable,
  });
  // ⚠️ AND THEN THE FETCH, in this order (plan S7-5-3). The heal is what keeps this list
  // minimal: a healed file has `recorded === installed`, so it needs no ancestor at all
  // and `planAncestorFetch` skips it. Running the fetch first would buy network calls for
  // files the heal was about to prove.
  //
  // The other half of the fleet, and it does not overlap: files that HAVE a recorded sha,
  // whose bytes moved because the owner edited them, and whose ancestor was never
  // persisted — `.engine-base/` is invented by this release. They are row 7 of
  // `mergeVerdict` today: preserved, frozen, with a `.new` sidecar. Hydrating the hole
  // HERE, before the three refresh families run, is what lets the very same pass merge.
  //
  // No `sourceDir !== brainDir` gate here on purpose: it lives inside `fetchAncestors`,
  // at the only place that spawns git, so no caller has to remember it.
  const { hydrated: ancestorsHydrated, failed: ancestorsFailed } = fetchAncestors({
    plan: planAncestorFetch({
      manifest: target,
      provenance: healedProvenance,
      installedFileMap: installedMergeFiles,
      baseContentMap: readBaseTree({ brainDir, rels: Object.keys(installedMergeFiles) }),
      table: fingerprintTable,
    }),
    sourceDir,
    brainDir,
    git,
  });
  // ⚠️ `plan.mergeScripts` is NOT here since S2b-3. Those four (auto-commit, auto-push,
  // status-line, verify-rag) are declared `merge` and were copied anyway — an owner who
  // tuned their commit hook lost the tuning at every update, silently. They now go
  // through step 2.bis-scripts below, which is why this slice is ONE commit: the moment
  // they leave this bucket, something else has to deliver them.
  const copyGlobs = [...plan.overwrite];
  const copied = [];
  for (const rel of selectEngineFilesToCopy({ sourceFiles, copyGlobs })) {
    if (copyInto(sourceDir, brainDir, rel)) copied.push(rel);
  }

  // 2.bis-retire RETIRE the skills the engine no longer ships (plan S6c, ADR 0039).
  //    FIRST of the skill steps, and deliberately: a manifest that both declares a skill
  //    `merge` and retires it (a half-finished edit, or a fetch mid-release) would
  //    otherwise have the engine carefully three-way-merge a directory it is about to
  //    delete. Provenance-guarded, on ADR 0036's shape — the decision is next door and
  //    every doubt preserves. The provenance is the BRAIN'S OWN (`local`), because the
  //    question is "did we deliver these exact bytes to YOU?", which only the brain's
  //    manifest can answer; the fetched one would be answering about someone else.
  const { skillsRetired, skillsRetirePreserved } = retireDeclaredSkills({
    brainDir,
    plan,
    provenance: local?.provenance,
  });

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
  const { skillsRefreshed, skillsPreserved, skillsMerged, conflicts, refreshedFileMap } = refreshUntouchedSkills({
    brainDir,
    sourceDir,
    sourceFiles,
    manifest: target,
    // The two families of base, in one map keyed by the INSTALLED path: the manifest's
    // recorded sha256 for the `merge` skills, the pre-copy staging tree for the staged
    // ones. They can never collide — a staged skill is, by construction, not a merge file.
    // No `?? {}`: object spread already ignores undefined, so the fallback could not
    // change a byte (mutation lesson — a guard that cannot matter is noise). The `?.`,
    // on the other hand, is load-bearing: a caller may legitimately have no `local`.
    // S7-3: the HEALED map, not the recorded one — same map plus what the brain can
    // prove about itself. A frozen brain's untouched skill is now provable like anyone's.
    provenance: { ...healedProvenance, ...stagedProvenance },
  });

  // 2.bis-scripts THE ENGINE SCRIPTS, same journey (plan S2b-3). The mirror image of the
  //    skills' freeze, and the half that could DESTROY rather than merely withhold: the
  //    four merge-declared top-level scripts were applied `replace`, so an owner's edit
  //    to their own auto-commit hook was overwritten at every update with no trace.
  //    Same provenance base, same three-way merge, same sidecars — the difference is the
  //    SYNTAX GATE, which `engine-script-refresh` wires itself (these files are EXECUTED,
  //    and a clean merge that does not parse would leave a brain that stops committing).
  //    Guarded on `sourceDir !== brainDir` by the shared carrier, like the skills.
  const {
    scriptsRefreshed,
    scriptsPreserved,
    scriptsMerged,
    scriptConflicts,
    refreshedFileMap: refreshedScriptMap,
  } = refreshEngineScripts({
    brainDir,
    sourceDir,
    sourceFiles,
    manifest: target,
    // No staged family here: an engine script ships AT its runtime path, always. So the
    // recorded sha256 — S7-3: or the HEALED one, which is that map plus what the brain can
    // prove — is the only base there is.
    provenance: healedProvenance,
  });

  // 2.bis-doctrine THE CONSTITUTION'S ENGINE HALF, third and last merge family (plan
  //    S5c). `CLAUDE.engine.md` was in NO regime at all, which is neither of the two
  //    bugs above: it was not clobbered and it was not frozen by a bad base — it was
  //    never delivered, by anything, since the day the brain was installed. A rule
  //    written into the ambient doctrine reached fresh installs and nobody else.
  //    Same carrier, same provenance base, same sidecars as the scripts. The
  //    difference is the ABSENCE of the syntax gate: doctrine is prose read by an
  //    agent, and gating it would refuse every merge it ever produced.
  //    ⚠️ On a brain deployed before this release there is no provenance for the file,
  //    so this preserves and REPORTS rather than delivering. That is the honest
  //    verdict, and the report says so in words that claim nothing (S4-3).
  const {
    doctrineRefreshed,
    doctrinePreserved,
    doctrineMerged,
    doctrineConflicts,
    refreshedFileMap: refreshedDoctrineMap,
  } = refreshEngineDoctrine({
    brainDir,
    sourceDir,
    sourceFiles,
    manifest: target,
    // Like the scripts and unlike the skills: the constitution ships AT its runtime
    // path, so the recorded sha256 is the only base there is — and S7-3 is what finally
    // gives the deployed fleet one, so THIS is the call the whole arc was built for.
    provenance: healedProvenance,
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
  //    write the reconciler ever makes to it. It was purely ADDITIVE until ADR 0036, and is
  //    now additive PLUS exactly ONE nominative removal: the `statusLine` WE installed, and
  //    only that one (provenance-guarded — see status-line-retreat.mjs). The additive half is
  //    unchanged: wire the engine-owned hook entries the brain is MISSING (e.g. a v3.1.0
  //    brain that never got session-self-heal / session-health / session-obsidian-hint),
  //    dedup by the engine script each hook runs, with the brain's OWN node interpreter + dir
  //    substituted into the template placeholders. Never overwrite, never touch a user entry;
  //    WRITE ONLY when something is actually added → a converged brain is byte-identical
  //    (no auto-commit churn). settings.json.template is itself an engine-delivered file
  //    (`replace` regime), so a brain that received the engine code CARRIES it — which means
  //    self-heal (sourceDir === brainDir) reads the brain's OWN template and DOES wire the
  //    hooks. That is exactly how a pre-3.2 brain converges at the next restart: the
  //    session-status bootstrap tick spawns this reconcile in self-heal mode (no 2nd update
  //    needed). Upgraders from v3.3.0+ converge the same way in-band via auto-finalize.
  const hooksAdded = [];
  const hooksRepaired = [];
  // ADR 0036: set when the retreat removed the statusLine WE installed, so the
  // caller can tell the owner their own line is back.
  let statusLineWasRemoved = false;
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
    // ADR 0036 — the status line RETREATS, which makes this write no longer purely
    // additive: it can now REMOVE one key, and one only. `statusLine` is a single
    // value, not a merged list, so a brain that still declares OURS keeps evicting
    // the owner's own line whatever ours prints. Guarded by provenance: we remove it
    // only when the command names our own scripts/status-line.mjs — anything they
    // wrote by hand survives untouched. The win32 prefix repair below therefore no
    // longer applies to ours (it is gone); it stays for a line that is not.
    const { settings: retreatedSettings, removed: statusLineRemoved } =
      withoutEngineStatusLine(brainSettings);
    const healedStatusLine = retreatedSettings.statusLine?.command
      ? repairWin32NodePrefix(retreatedSettings.statusLine.command, projectRoot)
      : retreatedSettings.statusLine?.command;
    const statusLineRepaired = healedStatusLine !== retreatedSettings.statusLine?.command;
    if (added.length > 0 || repaired.length > 0 || statusLineRepaired || statusLineRemoved) {
      const nextSettings = { ...retreatedSettings, hooks: healedHooks };
      if (statusLineRepaired) nextSettings.statusLine = { ...retreatedSettings.statusLine, command: healedStatusLine };
      writeFileSync(brainSettingsPath, JSON.stringify(nextSettings, null, 2) + "\n");
      hooksAdded.push(...added);
      hooksRepaired.push(...repaired, ...(statusLineRepaired ? ["statusLine"] : []));
    }
    statusLineWasRemoved = statusLineRemoved;
  }

  // 2.quinquies FLEET MIGRATION — stop ignoring the active-universe pointer (ADR 0034).
  //    A universe is the owner's context, not the machine's, so the pointer travels with
  //    the registry it points into. `.gitignore` is carried by NO engine regime, so the
  //    launcher's own change reaches no deployed brain: this is the only route to the
  //    fleet, and it runs on both paths (update AND SessionStart self-heal). Surgical and
  //    idempotent — see unignore-pointer.mjs. Nothing is created: a brain with no
  //    `.gitignore` has nothing to migrate. No `git add` is needed either, and none is
  //    written: the pointer simply becomes untracked, which makes the tree dirty, and BOTH
  //    persistence paths commit it before anything can pull — the update's own
  //    `commitEngineUpdate` (`add -A`) and the session-start sweep, which commits before
  //    `git pull --rebase` by construction. That is what keeps a first pull from hitting
  //    git's "untracked working tree file would be overwritten" dead end.
  let pointerUnignored = false;
  const gitignorePath = join(brainDir, ".gitignore");
  if (existsSync(gitignorePath)) {
    const { text, changed } = unignoreActiveUniverse(readFileSync(gitignorePath, "utf8"));
    if (changed) writeFileSync(gitignorePath, text);
    pointerUnignored = changed;
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
    // S6c: the engine's only subtractive door. Two lists, like every other family —
    // what went, and what was kept with the file that blocked it. Separate from
    // `skillsPreserved`, because a skill preserved from a REFRESH is still maintained
    // and a skill preserved from a RETIREMENT is one the engine has stopped shipping.
    skillsRetired,
    skillsRetirePreserved,
    installedFileMap,
    skillsRefreshed,
    skillsPreserved,
    // S2: a skill that kept the owner's edits AND took this update's changes, and one
    // where the two touched the same lines. Both travel to `formatReport` — a merge
    // nobody is told about lands silently, and a conflict nobody is told about is a
    // `.new` file appearing beside a skill with no explanation.
    skillsMerged,
    conflicts,
    // S2b-3: the same four verdicts for the engine SCRIPTS, in lists of their own. A
    // script is a path the owner opens, not a skill they know by name, so the report
    // says "file" about these — and their conflicts stay separable from a skill's.
    scriptsRefreshed,
    scriptsPreserved,
    scriptsMerged,
    scriptConflicts,
    // S5c: the same four verdicts for the constitution's ENGINE half. Lists of their
    // own, like the scripts', so a frozen doctrine can never be read as a frozen skill
    // — and because a `no-provenance` preserve on THIS file is the standing state of
    // the whole deployed fleet, not an incident.
    doctrineRefreshed,
    doctrinePreserved,
    doctrineMerged,
    doctrineConflicts,
    // S7-3 — what the brain proved about ITSELF this pass. Three consumers, and none of
    // them can re-derive it: the report says it out loud, and `runReconcileCli` persists
    // the map and the refs it learned. Empty on every brain that already had provenance,
    // which is every brain installed from v5.0.0 on — this is the migration's own trace.
    healed,
    healedProvenance,
    healedBaseRefs,
    // S7-5-3 — the ancestors this pass went and got. `ancestorsFailed` is what the report
    // speaks from, and it is EMPTY unless a fetch was actually attempted and failed: a
    // brain that never needed one must hear nothing, and a self-heal never even tries.
    ancestorsHydrated,
    ancestorsFailed,
    // ONE delivered map, because it feeds ONE thing: the provenance re-seed in
    // `runReconcileCli`. A script left out of it would be called "user-modified" at the
    // very next update and frozen again — the feature working exactly once per brain.
    refreshedFileMap: { ...refreshedFileMap, ...refreshedScriptMap, ...refreshedDoctrineMap },
    mcpServersAdded,
    hooksAdded,
    hooksRepaired,
    statusLineRemoved: statusLineWasRemoved,
    pointerUnignored,
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
  // S7-3 — the prior is the HEALED map: the manifest's own record PLUS whatever the brain
  // proved about itself this pass. Re-seeding from `manifest.provenance` here would throw
  // the heal away at the last step, and the very next update would meet the same frozen
  // brain — the feature working for one run and then forgetting.
  const provenance = reseedProvenance({
    priorProvenance: report.healedProvenance ?? manifest.provenance ?? {},
    manifest,
    deliveredFileMap: delivered,
  });
  // S4 — the base's VERSION travels with its digest, written by the same last writer,
  // for the same migration reason. The ref is the brain's OWN (`source.ref`, already
  // advanced by the parent's step 7): the child never fetched anything, so it has no
  // other version to speak of, and a brain that records none records nothing here.
  // S7-3 — the learned refs go UNDER the recorded ones: a heal tells us which version
  // those bytes first shipped at, which is worth having, but a ref the brain actually
  // recorded is a fact about ITS delivery and always wins.
  const baseRefs = reseedBaseRefs({
    priorBaseRefs: { ...report.healedBaseRefs, ...(manifest.baseRefs ?? {}) },
    manifest,
    deliveredFileMap: delivered,
    ref: manifest.source?.ref,
  });
  // 🚨 S7-3 WIDENED THIS GUARD, and the clause it rescues would otherwise have been
  // silently false. "A self-heal heals too" (design S7-0) depends on this write, and a
  // self-heal DELIVERS NOTHING — all three refresh families are gated on
  // `sourceDir !== brainDir`. Left as "delivered something", the heal would be computed,
  // used for one run and thrown away unwritten, so the next update would meet the same
  // frozen brain forever.
  // No `?? []` on `report.healed`: this report comes from `reconcileBrain` three lines up,
  // which always returns the array. A fallback that cannot fire is a mutant nest, not a
  // safety net (the lesson S7-2's comparator taught, applied one file over).
  if (Object.keys(delivered).length > 0 || report.healed.length > 0) {
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, provenance, baseRefs }, null, 2) + "\n");
  }

  // S1 — the base TREE, beside that record, and for the same reason the re-seed above
  // lives here: the child is the LAST writer on the update path, and on the first update
  // carrying this feature the parent ran the OLD code. A tree written only by step 7
  // would arrive one update late, on the very brains being migrated.
  //
  // Run even when nothing was delivered — that is precisely the migration case (a
  // self-heal converging a brain from its own code delivers nothing, and can still seed
  // every ancestor the brain is able to prove).
  syncBaseTree({ brainDir, manifest, provenance, deliveredFileMap: delivered });
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
