// ─────────────────────────────────────────────────────────────────────────────
// engine-ancestor-fetch.mjs — the git shell behind the planner
// (plan S7-5-2 of v5-unfreezes-the-existing-fleet-action.md).
//
// `planAncestorFetch` decided WHICH ancestors are worth going to get, and from which
// tag and which source path. This goes and gets them, and it is the half that touches
// the disk, so it is the half where a mistake is expensive: a wrong ancestor written
// into `.engine-base/` is not a failed fetch, it is a three-way merge that later
// resolves against someone else's file and reports success while doing it.
//
// Hence the one rule this module exists to enforce: **no byte reaches the disk before
// it matches the recorded sha.** `verifyBase` downstream asks the same question, but
// it asks it too late — by then the bytes are persisted, and a false ancestor is
// indistinguishable from a true one.
//
// BEST EFFORT, NEVER BLOCKING. No git, no network, a tag that has gone, a path that
// moved: every one of those simply leaves the file where it already is
// (`preserve/customized` + a `.new` sidecar). This module can regress nothing, which
// is what makes it safe to ship inside v5 rather than after it.
//
// In the EXISTING clone: `fetchSource` leaves a working tree with an `origin` remote
// and `update-engine` never removes it. Hence `git -C <sourceDir>` — `buildGitInvocation`
// sets no `cwd`, so a bare `git fetch` would run in whatever directory the process
// happens to occupy — and the explicit `tag <tag>` refspec, because the clone's
// `--single-branch` narrowed `remote.origin.fetch` to the cloned ref alone.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync } from "node:fs";
import { join } from "node:path";

import { baseRelPath, recordedVariant, verifyBase } from "./engine-base.mjs";
import { writeBaseEntries } from "./engine-base-fs.mjs";
import { defaultGit } from "./engine-fetch.mjs";
import { isSelfHeal } from "./update-mode.mjs";

const fetchArgs = (sourceDir, tag) => ["-C", sourceDir, "fetch", "--depth", "1", "origin", "tag", tag];
const showArgs = (sourceDir, tag, sourcePath) => ["-C", sourceDir, "show", `${tag}:${sourcePath}`];

export function fetchAncestors({ plan, sourceDir, brainDir, git = defaultGit }) {
  const hydrated = [];
  const failed = [];

  // 🚨 SAFETY, not an optimisation. On a SessionStart self-heal the source IS the
  // brain, and the brain is a git repo — the OWNER'S vault, whose `origin` is their
  // personal backup. `git fetch origin tag …` there would point engine machinery at a
  // private repository. The guard lives at the one place that spawns git, rather than
  // in every caller that would have to remember. `failed` stays empty on purpose:
  // nothing was attempted, so the report has nothing to say.
  //
  // 🚨 T8 — AND IT ASKS THE QUESTION THE ONE WAY THERE IS TO ASK IT. This compared the
  // raw strings, so `<brainDir>/` walked past it and the fetch went out against the
  // owner's own remote. The dangerous half is that it SUCCEEDS: nothing anywhere says a
  // word, the same blindness a missing `-C` has (RESULTS.md § S7-5).
  if (isSelfHeal({ brainDir, sourceDir })) return { hydrated, failed };

  // A second opinion on the planner's own rule, kept because the action it guards is
  // the irreversible one: an existing `.engine-base/<rel>` is the REAL recorded
  // ancestor, and overwriting it with bytes chosen on the strength of a historical
  // digest swaps a fact for a guess. The planner already excludes these; this is what
  // stops a future caller passing a plan it built some other way.
  const holes = plan.filter((p) => !existsSync(join(brainDir, baseRelPath(p.rel))));

  // ONE fetch per DISTINCT tag, then N cheap `git show`. Brains concentrate on a
  // handful of versions, and when a tag never arrived, asking for its blobs would be
  // N pointless subprocesses each certain to fail.
  const tagFetched = new Map();
  const entries = [];

  for (const { rel, tag, sourcePath, recorded, candidates } of holes) {
    // 🪟 TWO SHAPES, and the asymmetry is deliberate (W1). A HIT carries one tag: the
    // planner placed the recorded sha in the table, so the row is a FACT and the blob at
    // it is the delivered content whatever EOL the checkout hands back. A MISS carries
    // `candidates`: on a Windows brain the record is a CRLF digest the table cannot
    // place, so the rows are GUESSES and this loop is what proves one of them.
    //
    // An LF brain therefore walks a one-element list and issues exactly the calls it
    // always did — the miss path costs the rest of the fleet nothing.
    const attempts = candidates ?? [{ tag, sourcePath }];
    let proven = null;

    for (const attempt of attempts) {
      if (!tagFetched.has(attempt.tag)) tagFetched.set(attempt.tag, git(fetchArgs(sourceDir, attempt.tag)).ok);
      // A dead tag costs this candidate and no other. On a hit that is the end of the
      // file; on a miss the next row may well be alive, and a brain is not owed a
      // failure because one of its rel's versions has gone.
      if (!tagFetched.get(attempt.tag)) continue;

      const shown = git(showArgs(sourceDir, attempt.tag, attempt.sourcePath));
      if (!shown.ok) continue;

      // The verification, at the fetch site and before the write — and it asks a
      // different question of each shape.
      //
      // On a HIT, `verifyBase` is reused rather than re-spelled: a second spelling of
      // "matches the record" is a second place for the EOL forgiveness to be forgotten,
      // and the recorded sha was taken on the LF bytes the engine delivered.
      //
      // On a MISS, forgiveness is precisely what must not happen. The answer has to BE
      // bytes — the base must hold WHAT WAS DELIVERED TO THAT BRAIN, and on Windows that
      // is the CRLF form — so `recordedVariant` returns the byte-state it has PROVED, or
      // null. A row that cannot be proved is simply not this brain's ancestor.
      if (candidates) proven = recordedVariant({ recorded, content: shown.out });
      else if (verifyBase({ recorded, baseContent: shown.out }).usable) proven = shown.out;
      if (proven !== null) break;
    }

    if (proven === null) {
      failed.push(rel);
      continue;
    }

    // Filed under the INSTALLED rel, never the source path: a French brain reads
    // `templates/fr/<rel>` at that tag, but holds the file at `<rel>`, and a base
    // filed anywhere else is invisible to the merge that needs it.
    entries.push({ baseRel: baseRelPath(rel), content: proven });
    hydrated.push(rel);
  }

  writeBaseEntries({ brainDir, entries });
  return { hydrated, failed };
}
