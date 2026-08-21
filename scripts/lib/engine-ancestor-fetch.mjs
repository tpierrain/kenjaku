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

import { baseRelPath, verifyBase } from "./engine-base.mjs";
import { writeBaseEntries } from "./engine-base-fs.mjs";
import { defaultGit } from "./engine-fetch.mjs";

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
  if (sourceDir === brainDir) return { hydrated, failed };

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

  for (const { rel, tag, sourcePath, recorded } of holes) {
    if (!tagFetched.has(tag)) tagFetched.set(tag, git(fetchArgs(sourceDir, tag)).ok);
    if (!tagFetched.get(tag)) {
      failed.push(rel);
      continue;
    }

    const shown = git(showArgs(sourceDir, tag, sourcePath));
    // The verification, at the fetch site and before the write. `verifyBase` is reused
    // rather than re-spelled: a second spelling of "matches the record" is a second
    // place for the EOL forgiveness to be forgotten, and the recorded sha was taken on
    // the LF bytes the engine delivered.
    if (!shown.ok || !verifyBase({ recorded, baseContent: shown.out }).usable) {
      failed.push(rel);
      continue;
    }

    // Filed under the INSTALLED rel, never the source path: a French brain reads
    // `templates/fr/<rel>` at that tag, but holds the file at `<rel>`, and a base
    // filed anywhere else is invisible to the merge that needs it.
    entries.push({ baseRel: baseRelPath(rel), content: shown.out });
    hydrated.push(rel);
  }

  writeBaseEntries({ brainDir, entries });
  return { hydrated, failed };
}
