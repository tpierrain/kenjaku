// ─────────────────────────────────────────────────────────────────────────────
// update-engine.mjs — THE CORE (plan Step 4). Opt-in, non-destructive re-pull: it
// brings an already-installed brain up to a newer Engine pinned in the launcher,
// WITHOUT ever touching the user's notes, `.env`, constitution, settings or custom
// skills (ADR 0003/0012/0014). The deterministic engine; the conversational UX is
// a thin skill on top (Step 6, ADR 0016).
//
// It wires the Step 1→3 pure libs + four injected SEAMS (so the Gate runs offline):
//   1. fetchSource          → shallow-clone the recorded `source: {repo, ref}` (Step 2)
//   2. computeApplyPlan      → the write-allowlist from the fetched manifest (Step 3)
//   3. copy overwrite + engine-owned scripts (incl. update-engine itself → self-update)
//   4. regenerateLaunchers   → rebuild the .sh/.cmd launchers (ADR 0015; NOT copied —
//                              they are pure, untracked rag-launcher.mjs output)
//   5. runInstall            → `npm install` in the brain's rag/
//   6. runReindex            → reindex IFF the index schema moved (else the index stays)
//   7. record the new engineVersion + the pulled ref in the brain's manifest
//   8. finalizeReconcile     → re-exec the freshly-written reconciler once (ADR 0026)
//   9. commitEngineWrites    → commit what this update wrote, so it never leaves the
//                              brain's repo dirty and blocking the startup pull (ADR 0011)
// Everything outside the plan is untouchable BY CONSTRUCTION (the plan is an
// allowlist) — the Gate asserts byte-identity of the user's sacred files.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { RESTART_FLAG_REL } from "./lib/restart-nudge.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";

import {
  fetchSource as defaultFetchSource,
  resolveLatestTag as defaultResolveLatestTag,
  readTargetManifest,
} from "./lib/engine-fetch.mjs";
import { reconcileBrain } from "./lib/reconcile-brain.mjs";
import { reseedProvenance } from "./lib/engine-source.mjs";
import {
  defaultRunInstall,
  defaultRunReindex,
  defaultCountVaultNotes,
  defaultRegenerateLaunchers,
} from "./lib/engine-seams.mjs";
import { defaultFinalizeReconcile } from "./lib/auto-finalize.mjs";
import { defaultCommitEngineWrites } from "./lib/engine-commit.mjs";

// Re-export so the engine's own tests keep importing the count seam from here.
export { defaultCountVaultNotes };

// How many capabilities this update DELIVERED that the running conversation cannot
// see yet (Layer B config-freeze): a skill, an MCP server and a hook all load only at
// the next session start. Pure, and shared by the report banner and the CLI's
// restart-flag decision so the two can never drift apart.
export function countNewCapabilities(report) {
  return (
    (report.installedSkills?.length ?? 0) +
    (report.mcpServersAdded?.length ?? 0) +
    (report.hooksAdded?.length ?? 0)
  );
}

// Did this update place anything on disk that only takes effect at the next session
// start? Then the persistent restart flag must be armed (A2 / F-B7d), so the statusLine
// keeps nudging after the report banner has scrolled away.
export function needsRestart(report) {
  return (
    report.copied?.length > 0 ||
    Boolean(report.regenerated) ||
    countNewCapabilities(report) > 0 ||
    report.skillsRefreshed?.length > 0
  );
}

// F-B2 (ADR 0026) / issue #31: hooks are wired into settings.json by PATH
// (`scripts/session-health.mjs`) but read by the user by bare name. Both anchors are
// deliberate — only a LEADING `scripts/` and a TRAILING `.mjs` go — so a value that is
// not a script path at all ("statusLine") passes through untouched.
export function bareHookName(command) {
  return command.replace(/^scripts\//, "").replace(/\.mjs$/, "");
}

// Human summary the brain-side `update-engine` skill shows the user (Step 6, ADR
// 0016). Pure so the wording is unit-tested; the CLI entry only wires the I/O.
export function formatReport(report) {
  const { ref, engineVersion, copied, regenerated, reindexed, reindexReason, vaultNoteCount, committed, installedSkills = [], skillsRefreshed = [], skillsPreserved = [], mcpServersAdded = [], hooksAdded = [], hooksRepaired = [] } = report;
  // F-B2 (ADR 0026): the engine-owned SessionStart hooks wired into an upgrader's
  // settings.json, by their bare name (scripts/session-health.mjs → session-health).
  const wiredHooks = hooksAdded.map(bareHookName);
  // Issue #31: broken `cmd /c "…\run-node.cmd"` hook/statusLine commands healed in place
  // on a pre-fix Windows brain (by bare name; "statusLine" passes through unchanged).
  const healedHooks = hooksRepaired.map(bareHookName);
  // Honest reindex line: a schema move re-encodes EVERY note; the health-note pairing (ADR
  // 0026 decision B, upgraders) only makes sure the one engine-owned note is present and
  // indexed (incremental — your other notes are untouched) — never claim "the index format
  // changed" in that case.
  const reindexLine = !reindexed
    ? `   • index format unchanged — no reindex needed`
    : reindexReason === "health-note-seed"
      ? `   • ensured the engine health-check note is present and indexed (incremental — your other notes were not re-encoded)`
      : `   • reindexed — the index format changed (your notes were re-encoded, nothing lost)`;
  const lines = [
    // `?? "unknown"`: a manifest with no engineVersion block is broken, but the update
    // it describes is already done and recorded — printing "undefined" (or throwing)
    // would be the report lying about a change that DID happen.
    `✅ Engine updated to ${ref} (rag ${engineVersion?.rag ?? "unknown"}).`,
    `   • ${copied.length} engine file(s) swapped` + (regenerated ? " + launchers regenerated" : ""),
    reindexLine,
  ];
  // F2: the number the USER cares about — how many notes the brain holds. When a
  // reindex is running, searchability catches up as indexing finishes.
  if (typeof vaultNoteCount === "number") {
    const noun = vaultNoteCount === 1 ? "note" : "notes";
    lines.push(
      `   • your vault holds ${vaultNoteCount} ${noun}` +
        (reindexed ? " — searchable as the reindex finishes" : "")
    );
  }
  // Surface newly-delivered engine skills / MCP servers (ADR 0025) — the whole point
  // of an additive update: an upgrader must SEE they finally have the feature.
  if (installedSkills.length > 0) {
    lines.push(`   • new engine skill(s) installed: ${installedSkills.join(", ")}`);
  }
  if (mcpServersAdded.length > 0) {
    lines.push(`   • new MCP server(s) registered: ${mcpServersAdded.join(", ")}`);
  }
  // Increment 2.5: an engine skill the owner never touched was brought up to date.
  // Distinct from "new engine skill(s) installed" above — the skill was already
  // there, so the news is that it MOVED ON, not that it appeared.
  if (skillsRefreshed.length > 0) {
    lines.push(`   • engine skill(s) brought up to date: ${skillsRefreshed.join(", ")}`);
  }
  // ...and the mirror promise: a skill the owner edited is left ALONE. Report it per
  // skill, with the path of the new version dropped beside it, so the choice to adopt
  // the new bits stays theirs. `no-provenance` stays silent on purpose: it is a machine
  // detail (an older brain that was never fingerprinted), not a decision the user made
  // nor one they can act on.
  // The path is read UNCONDITIONALLY: `refreshUntouchedSkills` emits `customized` only
  // ever WITH a `newVersionPath` (engine-skill-refresh.mjs — the sidecar is written on
  // that same branch), so a "no path" fallback here would be a state the producer cannot
  // emit — a dead branch to maintain and mutation-test forever, not a safety net.
  for (const { skill, reason, newVersionPath } of skillsPreserved) {
    if (reason !== "customized") continue;
    lines.push(
      `   • your customized "${skill}" skill was kept exactly as you wrote it` +
        ` — the newer engine version sits next to it as ${newVersionPath}`,
    );
  }
  // The engine files this update rewrote are VERSIONED, so we committed them (step 9) —
  // otherwise they sit dirty forever and the next SessionStart `git pull --rebase`
  // refuses to run. The user will see that commit in their history, so we name it; and
  // we say it stayed local, because pushing is opt-in (`secondbrain.autopush`).
  if (committed === "committed") {
    lines.push(`   • the engine files that changed were committed locally (nothing pushed)`);
  }
  if (wiredHooks.length > 0) {
    lines.push(`   • new runtime hook(s) wired: ${wiredHooks.join(", ")}`);
  }
  if (healedHooks.length > 0) {
    lines.push(`   • repaired Windows hook command(s) (issue #31 — 'laude' error): ${healedHooks.join(", ")}`);
  }
  // F1.6 (ADR 0026, point 4): a freshly-installed skill/MCP is on disk but Claude
  // loads skills/MCP/hooks when a conversation STARTS (Layer B config-freeze), so it
  // is NOT yet live in THIS conversation. Say so LOUDLY (silence reads as "ready to
  // use") and point at the lighter sufficient action — a full restart, then RESUMING
  // this same conversation (field-proven, F4). Do NOT muddy it with "start a new
  // conversation": that is the distinct initial-rooting rule (a never-rooted session),
  // not what is needed just to pick up new capabilities.
  const newCapabilities = countNewCapabilities(report);
  if (newCapabilities > 0) {
    const noun = newCapabilities === 1 ? "capability" : "capabilities";
    const them = newCapabilities === 1 ? "it" : "them";
    lines.push(
      `   ⚠️ ACTION NEEDED — ${newCapabilities} new ${noun} ${newCapabilities === 1 ? "is" : "are"}` +
        ` installed on disk but NOT active in THIS conversation.`,
      `   A FULL RESTART of Claude (close it and reopen) is enough: come back to THIS same`,
      `   conversation afterwards and your brain can use ${them}. You do NOT need to start a`,
      `   brand-new chat for this. Until you restart, your brain CAN'T use ${them}.`,
      `   • If still missing after a restart, run /update-engine once more.`,
    );
  } else if (copied.length > 0 || regenerated || skillsRefreshed.length > 0) {
    // F-B7d (ship-blocker A1): even a steady-state swap with NO brand-new capability still
    // needs a restart — the MCP server, hooks and constitution THIS conversation loaded are
    // the OLD ones until Claude is reopened. Stay silent and a "✅ done" reads as "already
    // live", trapping the improvement behind a stale session. So warn LOUDLY — but WITHOUT the
    // new-capability counter / "run once more" fallback (those are reserved for actual new
    // capabilities). The genuine no-op (nothing swapped) skips this entirely → no crying wolf.
    lines.push(
      `   ⚠️ ACTION NEEDED — your engine was updated on disk, but THIS conversation is`,
      `   still running the OLD version. A FULL RESTART of Claude (close it and reopen) is`,
      `   enough: come back to THIS same conversation afterwards and the update takes effect.`,
      `   Until you restart, your brain keeps using the old engine.`,
    );
  }
  lines.push(`   Your notes, .env, constitution, settings and custom skills were left untouched.`);
  return lines.join("\n");
}

export async function updateEngine({
  brainDir,
  platform = process.platform,
  fetchSource = defaultFetchSource,
  resolveLatestTag = defaultResolveLatestTag,
  regenerateLaunchers = defaultRegenerateLaunchers,
  runInstall = defaultRunInstall,
  runReindex = defaultRunReindex,
  countVaultNotes = defaultCountVaultNotes,
  finalizeReconcile = defaultFinalizeReconcile,
  commitEngineWrites = defaultCommitEngineWrites,
}) {
  const manifestPath = join(brainDir, "engine-manifest.json");
  const local = JSON.parse(readFileSync(manifestPath, "utf8"));
  const source = local.source ?? {};

  // 1. Resolve the LATEST semver release tag on the remote (ADR 0017) — that is the
  //    engine version we pull and the new `source.ref` we record, so the displayed
  //    Version actually advances. No tag / offline → fall back to the pinned ref (the
  //    committed launcher manifest has no `source`, so we never read `target.source`).
  const ref = (await resolveLatestTag({ repo: source.repo })) ?? source.ref;

  //    Fetch the launcher at that ref + read its (target) manifest.
  const sourceDir = await fetchSource({ repo: source.repo, ref });
  const target = readTargetManifest(sourceDir);

  // 2.→6. CONVERGE the brain's on-disk engine state to the target manifest (ADR 0026):
  //    compute the write-allowlist, copy the engine files (F1/F2 refinements), install
  //    -if-absent the engine-declared skills, reconcile .mcp.json against
  //    engineMcpServers, add-if-absent the engine-owned hook entries into settings.json,
  //    regenerate the launchers, run install, reindex IFF the schema moved, and count the
  //    vault notes — all behind the deterministic, idempotent
  //    `reconcileBrain`. Extracted so the SAME reconciler runs at auto-finalize (a fresh
  //    child process at the end of this function) and at SessionStart self-heal.
  const {
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
  } = await reconcileBrain({
      brainDir,
      platform,
      sourceDir,
      target,
      local,
      regenerateLaunchers,
      runInstall,
      runReindex,
      countVaultNotes,
    });

  // 7. Record the new engine version + the ref we pulled, and RE-SEED `provenance`
  //    (Step 5): refresh the 3-way base for the merge files the engine just
  //    re-delivered (the engine-owned scripts, read back from disk), while the user's
  //    untouched merge files (CLAUDE.md/settings/skills) keep their prior base — so a
  //    future Phase 2 3-way still detects the user's edits.
  //    T1 (Increment 2.5): the skills the reconcile just REFRESHED are re-delivered
  //    content too, so they must be re-seeded here. Miss them and this manifest write
  //    (built from the `local` copy read before the reconcile) leaves their base at the
  //    OLD content → the next update calls them "user-modified" and never refreshes
  //    them again: the feature would work exactly once per brain, silently.
  //    Same for the skills the reconcile just INSTALLED (install-if-absent): they are
  //    engine-delivered content with no base yet, and a skill without a base is never
  //    refreshable again.
  const deliveredFileMap = {
    ...Object.fromEntries(copied.map((rel) => [rel, readFileSync(join(brainDir, rel), "utf8")])),
    ...installedFileMap,
    ...refreshedFileMap,
  };
  const updated = {
    ...local,
    engineVersion: target.engineVersion,
    indexSchemaVersion: target.indexSchemaVersion,
    source: { ...source, ref },
    provenance: reseedProvenance({
      priorProvenance: local.provenance ?? {},
      manifest: target,
      deliveredFileMap,
    }),
  };
  writeFileSync(manifestPath, JSON.stringify(updated, null, 2) + "\n");

  // 8. Auto-finalize (ADR 0026, Layer A): re-exec the FRESHLY-WRITTEN reconciler in a
  //    fresh child process, handing it the same source we fetched. A new process reads
  //    the just-written reconcile-brain.mjs from disk → escapes this process's module
  //    cache → runs the *just-installed* converge logic, collapsing the historical
  //    2-cycle into a single invocation. The child reconciles ONLY (never re-fetches,
  //    never re-finalizes) → no recursion. Done last, on top of an already-successful,
  //    already-recorded update.
  //
  //    FAIL-SOFT (#1): auto-finalize is a best-effort finisher on top of an update that
  //    is ALREADY done + recorded (step 7). A failure in the fresh child (flaky npm
  //    install, ABI hiccup) must NEVER reject this function — that would print the CLI's
  //    "the brain was NOT changed past this point" over a successful update. We belt it
  //    here even though defaultFinalizeReconcile is itself fail-soft, so EVERY injected
  //    seam is safe. SessionStart self-heal (Layer B) converges the rest on next start.
  try {
    await finalizeReconcile({ brainDir, sourceDir, platform });
  } catch {
    // swallowed on purpose — the update succeeded; self-heal will finish the job.
  }

  // 9. PERSIST what this update wrote. Everything above rewrote VERSIONED,
  //    engine-owned files (the manifest, scripts/lib/**, the launchers, plus
  //    whatever the finalize child converged) — and nothing else commits them: the
  //    brain's auto-commit is a hook fired by a session WRITE, so a user who only
  //    READS for a few days never triggers it. Left uncommitted, those files make
  //    the SessionStart `git pull --rebase` refuse to run ("you have unstaged
  //    changes") → the brain silently stops syncing at EVERY start until someone
  //    commits by hand. Committing here keeps the invariant: an update never leaves
  //    the repo dirty. It never PUSHES — that stays opt-in (`secondbrain.autopush`).
  //    Done LAST, after the finalize child's own writes, and fail-soft for the same
  //    reason as step 8: the update is already done + recorded.
  let committed = null;
  try {
    committed = commitEngineWrites({ brainDir, ref });
  } catch {
    // swallowed on purpose — a git hiccup must never fail an applied update. The
    // SessionStart banner says WHY the next pull is blocked (repo-status.mjs).
  }

  return {
    committed,
    ref: updated.source.ref,
    engineVersion: updated.engineVersion,
    copied,
    regenerated,
    reindexed,
    reindexReason,
    vaultNoteCount,
    installedSkills,
    skillsRefreshed,
    skillsPreserved,
    mcpServersAdded,
    hooksAdded,
    hooksRepaired,
  };
}

// A2 (F-B7d): arm the persistent restart flag so the statusLine keeps nudging until
// the user restarts — a belt for the in-session converged case (the report banner
// alone scrolls away). The next fresh, converged session clears it
// (session-self-heal). Fail-soft: the nudge is a convenience, never a blocker.
export function armRestartFlag(brainDir) {
  try {
    const flagPath = join(brainDir, RESTART_FLAG_REL);
    mkdirSync(dirname(flagPath), { recursive: true });
    writeFileSync(flagPath, "restart needed to finish the engine update\n");
  } catch {
    /* fail-soft */
  }
}

// The real I/O the CLI runs on: the brain the script lives in
// (<brain>/scripts/update-engine.mjs → brainDir = its parent), the real update, the
// real flag write and the real streams. Everything `runUpdateCli` decides is testable
// BECAUSE it is handed these instead of reaching for them (the `clear-example-notes`
// idiom) — the entry-point block below is now pure wiring.
export const realUpdateDeps = {
  brainDir: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  updateEngine,
  armRestartFlag,
  log: (s) => process.stdout.write(s),
  error: (s) => process.stderr.write(s),
};

// The command the brain-side `update-engine` skill runs, minus the process. Returns
// the exit code. FAIL LOUD (the project's strategy): on any error, print it to stderr
// and hand back a non-zero — never pretend it worked.
export async function runUpdateCli(deps = realUpdateDeps) {
  try {
    const report = await deps.updateEngine({ brainDir: deps.brainDir });
    if (needsRestart(report)) deps.armRestartFlag(deps.brainDir);
    deps.log(formatReport(report) + "\n");
    return 0;
  } catch (e) {
    // `?? e` catches a thrown non-Error (a bare string); `?? "no reason given"` catches
    // a rejection with no reason at all — a ❌ banner over an empty line tells nobody
    // anything, and this is the one output a failed update leaves behind.
    deps.error(`\n❌ update-engine failed — the brain was NOT changed past this point.\n${e?.message ?? e ?? "no reason given"}\n`);
    return 1;
  }
}

// ── CLI entry ────────────────────────────────────────────────────────────────
// Guarded so importing this module in tests does NOT run it.
if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(await runUpdateCli());
}
