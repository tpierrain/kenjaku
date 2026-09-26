#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// sync-report.mjs — the report `/sync` prints at its last step, and that the
// skill relays VERBATIM (issue #131).
//
//   node scripts/sync-report.mjs --before <sha> --committed yes|no --pushed ok|failed
//
//   --before     HEAD as it stood just before the rebase (after step 2's commit):
//                the files this /sync brought are the tree diff from there to HEAD,
//                so this machine's own replayed commits cancel out.
//   --committed  whether step 2 made a local commit.
//   --pushed     whether step 5's `git push` succeeded.
//
// A COMPOSITION ROOT: the decisions, and every word, are in lib/sync-report.mjs.
// This file reads the facts — the rebase's diff, the arrivals trace, the remote's
// last commit, who this machine is, the brain's language and time zone — and
// refuses (exit 2, nothing on stdout) rather than print a report built on a guess.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";

import { buildGit, repoRoot } from "./auto-commit.mjs";
import { readAuthorsState } from "./lib/author-identities.mjs";
import { BRAIN_LOCALE } from "./lib/demo-locale.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { buildTrace } from "./lib/remote-arrivals.mjs";
import { syncReport } from "./lib/sync-report.mjs";
import { vaultRagDir } from "./lib/universes.mjs";

const lines = (text) => text.split(/\r?\n/).filter(Boolean);

/** `--name value` pairs; each value must be one of `allowed` when given. Null when unusable. */
export function parseArgs(argv) {
  const value = (name) => {
    const at = argv.indexOf(name);
    return at === -1 ? undefined : argv[at + 1];
  };
  const before = value("--before");
  const committed = value("--committed");
  const pushed = value("--pushed");
  if (!before || !["yes", "no"].includes(committed) || !["ok", "failed"].includes(pushed)) return null;
  return { before, committed: committed === "yes", pushed };
}

export function runSyncReport(argv, { brainDir = repoRoot(import.meta.url), write = (s) => process.stdout.write(s), warn = (s) => process.stderr.write(s) } = {}) {
  const args = parseArgs(argv);
  if (!args) {
    warn("usage: node scripts/sync-report.mjs --before <sha> --committed yes|no --pushed ok|failed\n");
    return 2;
  }
  const git = buildGit(brainDir);
  const diff = git(["diff", "--name-only", args.before, "HEAD"]);
  if (!diff.ok) {
    warn(`sync-report: cannot compare ${args.before} with HEAD — ${diff.out.trim()}\n`);
    return 2;
  }

  // The remote's last commit, by its COMMITTER: that is who pushed it there.
  const head = git(["log", "-1", "@{u}", "--format=%cI%x09%cn%x09%ce"]);
  const [at, name, email] = head.ok ? head.out.trim().split("\t") : [];
  const remoteHead = at ? { at, name, email } : null;

  const me = { name: git(["config", "user.name"]).out.trim(), email: git(["config", "user.email"]).out.trim() };
  const { identities } = readAuthorsState({ readFileSync: (p) => readFileSync(p, "utf-8") }, vaultRagDir(brainDir));

  write(
    `${syncReport({
      locale: BRAIN_LOCALE,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      trace: buildTrace(brainDir).read(),
      remoteHead,
      me,
      identities,
      thisSync: { committed: args.committed, pulled: lines(diff.out), pushed: args.pushed },
    })}\n`,
  );
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, (argv) => runSyncReport(argv));
