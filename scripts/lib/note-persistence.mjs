// ─────────────────────────────────────────────────────────────────────────────
// note-persistence.mjs — the writer scripts' own persistence (issue #77).
//
// The auto-commit hook matches `Write|Edit`. `refresh-note.mjs` and
// `file-back-note.mjs` are invoked from Bash *on purpose* — that routing is what
// makes their notes conformant by construction (ADR 0009) — so the persistence
// net has never seen the writes they produce. Measured on a real brain,
// 2026-08-23: one `/consolidate` pass refreshed five pages, printed `✓ Refreshed`
// five times, and committed none of them. The session looked like it had
// persisted its work; it had not.
//
// 🧭 The design decision that buys correctness is the one that removed the safety
// net, which is why no amount of "remember to commit" fixes it: the gesture that
// writes the note is the one that must version it.
//
// It WRAPS `attemptCommit` rather than re-deciding anything. The refusal of an
// unmerged tree, the staging and the commit message are the same gesture both
// hooks make; a second spelling of "commit the vault" would be two behaviours to
// keep in step forever, and this one would be the copy nobody watches.
//
// COMMIT-ONLY, deliberately, and it is not an oversight: the push stays debounced
// to the Stop hook (`auto-push.mjs`), which fires once per turn. A `/consolidate`
// pass refreshes several pages in a row, so pushing here would mean one network
// round-trip per note — precisely the cost the debounce was built to avoid. The
// commit is the safety net; the push is a transport, and it catches up at the end
// of the turn.
// ─────────────────────────────────────────────────────────────────────────────
import { attemptCommit } from "./vault-commit.mjs";

// Commits whatever the write left dirty. Returns attemptCommit's own vocabulary:
// "committed" | "clean" | "conflicted" | "failed". NEVER throws — the note is
// already on disk by the time this runs, so a git that explodes must not take the
// write's own report down with it.
export function persistNote({ git }) {
  try {
    return attemptCommit({ git });
  } catch {
    return "failed";
  }
}

// What the owner is told. `null` means say nothing: a commit that worked is not
// an event, and a script that narrates its own success trains people to skim.
// Everything else is a warning, INCLUDING an outcome nobody planned for — the one
// thing this must never do is let an unrecognised answer read as "all good".
export function persistenceWarning(outcome, relPath) {
  if (outcome === "committed" || outcome === "clean") return null;
  const note = `vault/${relPath}`;
  if (outcome === "conflicted") {
    return (
      `⚠️ ${note} is written but NOT committed — your brain's repo has a merge in progress, ` +
      `so nothing was staged: committing now would bury the <<<<<<< markers inside your notes. ` +
      `Finish the merge first, then commit.`
    );
  }
  return (
    `⚠️ ${note} is written but NOT committed — the note is on disk and not versioned. ` +
    `Run \`git add -A && git commit\` in your brain to get git's own reason ` +
    `(a missing git identity is the usual culprit).`
  );
}
