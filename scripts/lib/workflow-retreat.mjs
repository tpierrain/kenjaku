// ─────────────────────────────────────────────────────────────────────────────
// workflow-retreat.mjs — THE ENGINE STOPS RUNNING A BUILD IN THE OWNER'S ACCOUNT
// (issue #92). The launcher shipped its own CI into every brain; a brain wired to
// a remote pushes once per turn, so saving a note started a full build matrix in
// the owner's GitHub account and billed them for it. Measured in the field: 19
// runs a day, ~720 Actions minutes against a free allowance of 2,000, and every
// run red, because a brain is not the launcher.
//
// Stopping the copy (`tracked-files.mjs`) saves brains created from now on. This
// is the half for the brains already out there: at their next engine update, the
// two files go.
//
// ── WHY THIS IS NOT `skill-retirement`, which already retires things ──────────
// That door is PROVENANCE-GUARDED: it removes only what it can prove it delivered,
// byte for byte, from the brain's recorded provenance. No brain in the field records
// ANY provenance for these two files — they were in no regime, so nothing ever
// recorded them, and `engine-fingerprints.json` does not carry them either. Routed
// through that door, every workflow on every brain would answer `no-provenance` →
// preserve, and the release would announce a fix that removed nothing.
//
// So the proof is a different one, and it is deliberately narrow: we remove the two
// files THE LAUNCHER HAS EVER SHIPPED, by name. A workflow the owner wrote has a
// different name and is untouchable — which is the same cost asymmetry ADR 0036
// wrote down for the status line, reaching the same answer by another route: a
// leftover file of ours is cosmetic, deleting someone's own automation is not.
//
// And the deletion is RECOVERABLE: a brain is a git repository, the update stages
// with `add -A`, so the removal lands in the owner's own history as a commit they
// can read and revert. That is what makes "by name, without provenance" affordable
// here and nowhere else.
//
// PURE decision (`isRetreatable`) + the thinnest possible I/O, the house pattern —
// and it earns its keep loudest here, because this is one of the two places in the
// product that calls `rmSync` in someone's brain.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { isSelfHeal } from "./update-mode.mjs";

// 🎯 THE BLAST RADIUS, and it is a literal list of two. No glob, no manifest entry, no
// value read from anywhere: there is no input to this door, which is precisely what makes
// it safe enough to ship in a hurry. Adding an entry here is agreeing to delete that file
// in every brain in the fleet, and a test asserts the list WHOLE so the agreement is
// explicit rather than incidental.
export const SHIPPED_WORKFLOWS = [".github/workflows/ci.yml", ".github/workflows/mutation-nightly.yml"];

// The one directory a retreat may ever reach into.
const WORKFLOWS_DIR = ".github/workflows/";

// 🗣️ THE SENTENCE, said in MONEY rather than in filenames — the owner's experience of this
// defect was a bill and a flood of failure mail from the repository holding their notes, so
// "2 workflow files removed" would be the one report that fails to connect the fix to the
// thing they actually noticed.
//
// It lives HERE, beside the deletion, because two voices say it and they must not drift:
// `update-engine.mjs` prints it in the update recap, and `reconcile-brain.mjs`'s child
// process prints it on the ONE run where that recap cannot — the update that performs the
// rescue is driven by the OLD engine, which has never heard of this sentence, and by the
// next update there is nothing left to remove. Two copies of a sentence is how one of them
// quietly becomes false.
export const BUILDS_STOPPED =
  "Your brain has stopped running builds in your GitHub account: it used to carry the" +
  " launcher's own automated checks, so every note you saved started one (and made it fail)." +
  " A brain stores and syncs your notes, it never builds anything. The failure mail stops," +
  " and so does the cost.";

/**
 * May this path be removed from a brain? Two refusals, and the second is the one that
 * matters: `startsWith` says where a path BEGINS and has nothing whatever to say about
 * where it ends up, so `.github/workflows/../../vault/a-note.md` begins exactly where
 * this door lives and lands in the owner's notes. Refused by SEGMENT, on both separators
 * (`path.join` treats `\` as one on Windows), so a legitimate name that merely contains
 * dots stays removable — a guard that is wrong about honest input is one people widen
 * instead of read.
 */
export function isRetreatable(rel) {
  if (typeof rel !== "string" || !rel.startsWith(WORKFLOWS_DIR)) return false;
  return !rel.split(/[\\/]/).some((segment) => segment === "." || segment === "..");
}

/**
 * Removes, from a deployed brain, the workflows the launcher used to ship. Returns
 * `{ removed }` — the paths actually deleted, in declaration order, and empty on the
 * overwhelming majority of updates (every brain that already converged, and every brain
 * created after the copy fix). Silent when there is nothing to remove: an owner must not
 * be told about a rescue that did not happen.
 */
export function retireShippedWorkflows({ brainDir, sourceDir }) {
  const removed = [];

  // ⛔ UPDATE-TIME ONLY, and the gate is here rather than at the call site for the reason
  // the skills retirement gives for the same choice: this is a line that deletes, so no
  // caller should have to remember. The SessionStart self-heal runs with the brain as its
  // own source, detached, with its output going nowhere at all — a delete there is a
  // delete nobody is ever told about. An ABSENT `sourceDir` is caught by the same line and
  // deliberately: a caller who has not said this is an update has not earned a deletion,
  // and "I cannot tell" must fail towards keeping.
  if (sourceDir === undefined || isSelfHeal({ brainDir, sourceDir })) return { removed };

  for (const rel of SHIPPED_WORKFLOWS) {
    // The constants above satisfy this today and a test pins that. It is asked anyway,
    // at the only line that deletes, so the guard cannot be bypassed by editing a list.
    if (!isRetreatable(rel)) continue;
    const abs = join(brainDir, rel);
    if (!existsSync(abs)) continue;
    // `force` covers the one case no test can stage: the file vanishing between the check
    // and this line. An update that throws there strands the brain mid-pass over a file
    // that is already gone, which is the outcome this codebase's fail-soft habit exists to
    // avoid. The empty `.github/workflows/` directory is left behind on purpose: git does
    // not track directories, GitHub runs nothing without a file in it, and removing a
    // directory the owner may have put their own workflow in is a risk that buys nothing.
    rmSync(abs, { force: true });
    removed.push(rel);
  }

  return { removed };
}
