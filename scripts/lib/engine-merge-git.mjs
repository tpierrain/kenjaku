// ─────────────────────────────────────────────────────────────────────────────
// engine-merge-git.mjs — THE ONE IMPURE HALF of S2's merge (plan S2a-2).
//
// `engine-merge.mjs` decides what to do with an ancestor; this reconciles three
// texts, and it is the only part that touches a process. The split is deliberate:
// the mutation score then judges the DECISION rather than a subprocess, and this
// file stays small enough to read in one sitting.
//
// WHY GIT, decided 2026-08-20 and recorded in the plan: a hand-rolled diff3 would
// be the highest-risk code of the chantier (a subtle bug destroys an owner's work)
// for an algorithm that is solved — and a brain IS a git repository already (the
// installer runs `git init`, the auto-commit hook runs git at every session), so
// this adds no dependency. `scripts/` ships as plain files with no install step,
// so an npm package was never an option either.
//
// `git merge-file -p` writes the reconciliation to stdout and leaves the inputs
// alone; its exit status is the CONFLICT COUNT (0 = clean), and negative — 255 in
// practice — is a technical failure, which must never be passed off as a conflict.
// ─────────────────────────────────────────────────────────────────────────────
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { normalizeEol } from "./engine-base.mjs";

// Named, and named recognisably: a test sweeps the temp directory for it, and a
// human debugging a full disk should be able to tell whose files these are.
export const MERGE_TMP_PREFIX = "kenjaku-merge-";

// What the owner reads inside their own file when a region clashes. Neutral by
// default; the caller passes the engine's version for `theirs` when it has one.
// ⚠️ User-facing text: the final wording is Thomas's call (`release-notes-tone`).
const DEFAULT_LABELS = { ours: "your version", base: "engine base", theirs: "engine update" };

// Anything above this is git refusing to run at all (a missing binary, a broken
// install). Git returns the conflict count otherwise, and no real file has hundreds
// of conflicting regions — but the line has to be drawn somewhere explicit rather
// than by "large numbers look wrong".
const GIT_FAILURE_STATUS = 128;

// The exact git request, as a VALUE (CONVENTIONS.md §5ter) — and here that rule
// earns its keep twice over: the ARGUMENT ORDER *is* the ours/theirs contract, and
// as a value it can be asserted whole instead of being read back out of conflict
// markers. Swapped, git still returns a plausible file — one in which the engine
// silently wins every region the owner touched.
export function buildMergeFileInvocation({ paths, labels = {}, gitBin = "git" }) {
  const { ours: oursLabel, base: baseLabel, theirs: theirsLabel } = { ...DEFAULT_LABELS, ...labels };
  return {
    command: gitBin,
    // `-p` writes the reconciliation to stdout and leaves the three inputs alone;
    // `--diff3` keeps the base's own lines in a conflict, so the owner can see what
    // the sentence USED to say — half of what makes a conflict resolvable.
    args: ["merge-file", "-p", "--diff3", "-L", oursLabel, "-L", baseLabel, "-L", theirsLabel, paths.ours, paths.base, paths.theirs],
    // A skill's reference bundle can be a few hundred KB, and a merge truncated at
    // node's 1 MB default would be a corrupted file delivered as a clean one.
    options: { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  };
}

export function mergeWithGit({ base, ours, theirs, labels = {}, gitBin = "git", run = spawnSync }) {
  const dir = mkdtempSync(join(tmpdir(), MERGE_TMP_PREFIX));
  try {
    // Normalised before they ever reach git. A Windows brain can hold its installed
    // file in CRLF with nobody having touched a word; left as they are, EVERY line
    // reads as changed on both sides and every merge becomes a total conflict — the
    // whole fleet handed sidecars for whitespace. The engine ships LF, so LF is what
    // comes back.
    const paths = Object.fromEntries(
      Object.entries({ ours, base, theirs }).map(([side, content]) => {
        const abs = join(dir, side);
        writeFileSync(abs, normalizeEol(content));
        return [side, abs];
      }),
    );
    const { command, args, options } = buildMergeFileInvocation({ paths, labels, gitBin });
    const result = run(command, args, options);
    // A technical failure must never come back looking like a conflict: a false
    // conflict tells the owner they have work to do AND holds the base back, so the
    // file quietly leaves the update regime. The caller catches this and preserves.
    if (result.error) throw new Error(`${command} merge-file could not run: ${result.error.message}`);
    if (result.status === null || result.status < 0 || result.status >= GIT_FAILURE_STATUS) {
      throw new Error(`${command} merge-file failed (status ${result.status}): ${(result.stderr ?? "").trim()}`);
    }
    return { clean: result.status === 0, merged: result.stdout };
  } finally {
    // An update writes inside a brain: leaving three copies of the owner's files in
    // the system temp directory at every merge is a privacy leak, not untidiness.
    rmSync(dir, { recursive: true, force: true });
  }
}
