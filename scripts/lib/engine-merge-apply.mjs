// ─────────────────────────────────────────────────────────────────────────────
// engine-merge-apply.mjs — the I/O half of S2's merge: it carries `mergeVerdict`'s
// answer to the disk, for ANY family of engine-owned file (plan S2b-1).
//
// It was `refreshUntouchedSkills`'s inner loop until a second client appeared —
// the four engine scripts (S2b), with the constitution behind them (S2c). Nothing
// here knows what kind of file it is carrying: the caller hands it the
// (installed ← source) pairs and a `groupOf(rel)` saying how the report should be
// grouped, and gets back what was done.
//
// The DECISION is `engine-merge.mjs`'s (pure, nine rows); the MERGE is
// `engine-merge-git.mjs`'s (one subprocess). This module reads bytes and writes
// bytes, and is where every path in the brain is derived.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// WHERE the ancestor lives. The proof itself, and every question asked of it,
// belong to `engine-merge.mjs`.
import { baseRelPath, sidecarPath } from "./engine-base.mjs";
import { mergeVerdict } from "./engine-merge.mjs";
import { mergeWithGit } from "./engine-merge-git.mjs";
import { resolveLocaleSource } from "./engine-copy-select.mjs";
import { readBrainLocale } from "./brain-locale.mjs";
import { isSelfHeal } from "./update-mode.mjs";

// ⚠️ GUARD: `sourceDir === brainDir` means SessionStart self-heal — no new content,
// and nobody asked for anything. A file is only ever rewritten during an update the
// owner explicitly requested (auto-finalize hands the reconciler the FETCHED source).
export function applyMergeGoverned({
  brainDir,
  sourceDir,
  sourceFiles,
  pairs,
  provenance = {},
  merge = mergeWithGit,
  groupOf,
  verifyWrite,
}) {
  const refreshed = [];
  const preserved = [];
  const merged = [];
  const conflicts = [];
  const deliveredFileMap = {};
  const report = { refreshed, preserved, merged, conflicts, deliveredFileMap };
  // The spelling that was already right, now the shared one (T8): three doors asked
  // this question three ways, and only this one normalized. A rule that lives in one
  // of three copies is not a rule, it is the copy that happened to be correct.
  if (isSelfHeal({ brainDir, sourceDir })) return report;

  const locale = readBrainLocale(brainDir);
  // Reported per GROUP, not per file: for a skill that is the subtree ("your
  // prepare-1-1 stands as you wrote it", not a list of paths); for an engine script
  // the group is the file itself. Deduped on the group's NAME, never on "has this
  // list anything in it yet" — the second form silences every entry after the first,
  // and an owner who resolves one conflict never learns the others exist.
  const noteOnce = (list, entry) => {
    if (!list.some((seen) => seen.name === entry.name)) list.push(entry);
  };
  const nameOnce = (list, name) => {
    if (!list.includes(name)) list.push(name);
  };

  for (const { rel, sourceRel } of pairs) {
    // The bytes come from the SOURCE path (a staged skill ships at
    // `engine-skills/<name>/…`, a locale-owned file elsewhere again); every path
    // derived below hangs off the INSTALLED path. Swapping the two would have the
    // engine writing its own tree layout into the brain.
    const candidate = readFileSync(join(sourceDir, resolveLocaleSource({ rel: sourceRel, locale, sourceFiles })), "utf8");
    const installedPath = join(brainDir, rel);
    const installed = existsSync(installedPath) ? readFileSync(installedPath, "utf8") : null;
    // The ancestor is read HERE rather than handed in: this module already holds
    // `brainDir` and already reads the disk, so the merge reaches a new family of
    // files without a single caller signature changing. A brain that has never held
    // a tree simply reads `null`, which is `verifyBase`'s `absent` — and the verdict
    // degrades to the behaviour that predates S2.
    const basePath = join(brainDir, baseRelPath(rel));
    const baseContent = existsSync(basePath) ? readFileSync(basePath, "utf8") : null;
    const name = groupOf(rel);

    let outcome;
    try {
      outcome = mergeVerdict({ installed, recorded: provenance[rel], baseContent, candidate, merge });
    } catch {
      // The merge seam throws on a TECHNICAL failure (a git that cannot run), never
      // on a conflict. Letting that escape would take a whole update down over one
      // file, so this one degrades to what a brain with no ancestor gets — the
      // owner's copy stands, the engine's version waits beside it — and the run goes on.
      outcome = { verdict: "preserve", reason: "merge-failed", sidecar: candidate };
    }

    // 🛑 THE GATE, and it is asked about the MERGE and nothing else. A fast-forward
    // writes the engine's own candidate, which the suite already tested; the merge's
    // output exists nowhere but this machine, and for a caller whose files are
    // EXECUTED (S2b's four engine scripts) those unseen bytes run at every session.
    // A caller with no gate — the skills, which are read and not run — is untouched.
    //
    // The two failures say DIFFERENT things on purpose: `merge-unsafe` tells the owner
    // their merged file would not have parsed, `merge-failed` tells them the tool could
    // not answer. Saying the first when the second is true is an accusation the engine
    // has no evidence for, and it would send them hunting through a file that is fine.
    if (outcome.verdict === "merge" && verifyWrite) {
      try {
        if (!verifyWrite({ rel, content: outcome.write })) {
          outcome = { verdict: "preserve", reason: "merge-unsafe", sidecar: candidate };
        }
      } catch {
        outcome = { verdict: "preserve", reason: "merge-failed", sidecar: candidate };
      }
    }
    const { verdict, reason, write, deliver, sidecar } = outcome;

    // A sidecar left by a previous update is a claim ("a newer version awaits") that
    // only two verdicts still back: a preserved customization, and a real conflict. Any
    // other makes it a lie — the owner adopted it, or we just merged under it — so it goes.
    // Cleared UNCONDITIONALLY, and the branches below re-drop it where it is still true:
    // guarding this on the verdict would be redundant with that write (rm-then-write and
    // write-alone leave the same bytes), i.e. a condition no test could tell apart.
    rmSync(sidecarPath(installedPath), { force: true });

    // ONE place decides whether bytes reach the disk, and it is byte equality: a merge
    // whose result is what was already installed must not churn the auto-commit history
    // for a no-op, and neither must a converged brain.
    if (write !== undefined && write !== installed) {
      mkdirSync(dirname(installedPath), { recursive: true });
      writeFileSync(installedPath, write);
    }
    // 🛑 What the engine DELIVERED, never what was written. On a clean merge those are
    // different bytes, and this map feeds `reseedProvenance` and `syncBaseTree`: recording
    // the merged file as the ancestor would make it read untouched at the next update, and
    // the fast-forward would clobber the edit that was just preserved.
    if (deliver !== undefined) deliveredFileMap[rel] = deliver;
    // "Never overwritten" must not mean "never offered": the engine's version (or, on a
    // conflict, the marked-up merge — everything mergeable already merged) lands BESIDE
    // the owner's so adopting it stays their call. `.new` is loaded by nothing.
    //
    // ⚠️ THIS COMMENT USED TO END: *"A `no-provenance` preserve gets none: it says we
    // cannot PROVE anything, and littering an older brain with unexplained sidecars
    // would be noise, not a choice."* It is kept, corrected, because the reasoning was
    // sound and it is the PREMISE that stopped being true. **S10 explains the sidecar**:
    // the next conversation asks about the file in plain words and offers three answers,
    // two of which need the engine's version to be readable on disk. Unexplained is what
    // made it noise; a question makes it the choice. What the old rule was right about
    // survives one row up: a brain already holding the candidate exits at
    // `unchanged/no-base` and is still offered nothing.
    if (sidecar !== undefined) writeFileSync(sidecarPath(installedPath), sidecar);

    // `absent-install` reports down the SAME path as `refresh`: install-if-absent decides
    // one level up (at the skill DIR, `reconcile-brain.mjs` step 2.bis), so a file a
    // release ADDS under a subtree the brain already has is invisible to it. Dropping it
    // here would leave that file unreachable by any number of updates.
    if (verdict === "refresh" || verdict === "absent-install") {
      nameOnce(refreshed, name);
    } else if (verdict === "merge") {
      nameOnce(merged, name);
    } else if (verdict === "conflict") {
      noteOnce(conflicts, { name, newVersionPath: sidecarPath(rel) });
    } else if (verdict === "preserve") {
      // 🧭 NO "preserve without an offer" ARM ANY MORE, and the measurement is what
      // proved it dead: a ternary stood here, and both of its mutants survived because
      // NOTHING produces that state. Every preserve carries a sidecar — rows 3 and 7 of
      // `mergeVerdict` set `sidecar: candidate`, and so do this module's own two
      // degradations (`merge-failed`, `merge-unsafe`). Before S10-1 the `no-provenance`
      // row deliberately offered nothing, and that arm was its home; S10 gave it one,
      // because a file nobody can prove is exactly the file the next conversation must
      // be able to ask about. A branch no input can reach is not a safety net, it is a
      // claim about a state that does not exist.
      noteOnce(preserved, { name, reason, newVersionPath: sidecarPath(rel) });
    }
  }
  return report;
}
