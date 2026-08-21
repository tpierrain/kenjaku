// ─────────────────────────────────────────────────────────────────────────────
// locale-drift.mjs — does a `templates/<locale>/<rel>` twin still carry what its
// English source carries? It judges NO translation quality: it names the commits a
// human has to look at, and stops there.
//
// THE CRITERION is *unpaired commits*: commits touching `<rel>` since the twin's own
// last commit that do not ALSO touch the twin. Measured on the 16 real pairs, the
// obvious signal (commits on EN since the twin's date) reads 1 for a perfectly
// synchronised pair — a pair updated in ONE shared commit contains that commit in
// its own window — and 14 of the 16 scored exactly that while being in sync.
//
// ⚠️ TWO LIMITATIONS, stated rather than discovered later. A RENAME resets the window
// and makes this under-report: `--follow` exists, is per-pair, and carries its own
// heuristics — an under-reporting guard is honest, a mis-attributing one is not. And
// a twin created LATER than its source is assumed current at creation, which is what
// creating it means.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";

import { buildGitInvocation } from "./engine-fetch.mjs";

// 🛑 Pinned. `%h` widens on its own as a repository grows, and the waiver map is keyed
// on exactly what the failure message prints — so copying a sha out of the message has
// to keep matching next year.
const ABBREV = "--abbrev=7";

const SEPARATOR = "\t";

export const twinLastCommitArgs = (sourcePath) => [
  "log",
  "-1",
  "--format=%H",
  "--",
  sourcePath,
];

export const commitsSinceArgs = (since, path) => [
  "log",
  `--format=%h${SEPARATOR}%s`,
  ABBREV,
  `${since}..HEAD`,
  "--",
  path,
];

// The default seam THROWS when git fails, and that is deliberate: the `{ok:false}`
// convention `defaultGit` uses would turn a broken git call into "no drift found",
// which is the exact silence this guard exists to break. The INVOCATION is still
// `engine-fetch`'s builder — a second spelling of "ask git" would be a second
// behaviour to keep in step forever (CONVENTIONS §5ter).
export function defaultLog(args, execFile = execFileSync) {
  const { command, args: argv, options } = buildGitInvocation(args);
  return execFile(command, argv, options).trim();
}

export function parseCommits(out) {
  return (out ?? "")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf(SEPARATOR);
      return { sha: line.slice(0, at), subject: line.slice(at + 1) };
    });
}

export function unpairedCommits({ commits, pairedShas, waived = {} }) {
  const paired = new Set(pairedShas);
  return commits.filter(({ sha }) => !paired.has(sha) && !(sha in waived));
}

// A rel is locale-owned iff a `templates/<locale>/` twin exists — the engine's own
// rule (`engine-copy-select.mjs`: "with no list to maintain here"), reused so new
// pairs are inherited for free. The mirror case is deliberate: an English file with
// NO twin is not an omission, it means the product did not localize it, and reporting
// it would flood the output with every English file forever.
export function localeDriftPairs(sourceFiles) {
  const tracked = new Set(sourceFiles);
  return sourceFiles
    .flatMap((sourcePath) => {
      const m = /^templates\/([^/]+)\/(.+)$/.exec(sourcePath);
      return m && tracked.has(m[2])
        ? [{ sourcePath, locale: m[1], rel: m[2] }]
        : [];
    })
    .sort((a, b) => (a.sourcePath < b.sourcePath ? -1 : 1));
}

export function measureLocaleDrift({ sourceFiles, waived = {}, git = defaultLog }) {
  return localeDriftPairs(sourceFiles)
    .map(({ sourcePath, rel }) => {
      const since = git(twinLastCommitArgs(sourcePath));
      const commits = unpairedCommits({
        commits: parseCommits(git(commitsSinceArgs(since, rel))),
        pairedShas: parseCommits(git(commitsSinceArgs(since, sourcePath))).map((c) => c.sha),
        waived,
      });
      return { rel, sourcePath, commits };
    })
    .filter(({ commits }) => commits.length > 0);
}

// Subjects, never a count: `sync` and `prepare-1-1` both scored 1, and one was a third
// of the file while the other was a one-line review fix. A number tells a human nothing
// and trains them to ignore the guard.
export function describeDrift(drifting) {
  return [
    `${drifting.length} localized file(s) behind their English source:`,
    ...drifting.flatMap(({ rel, sourcePath, commits }) => [
      `  ${sourcePath} is behind ${rel}:`,
      ...commits.map(({ sha, subject }) => `    ${sha} ${subject}`),
    ]),
    "",
    "Two ways to clear each commit, and only two:",
    "  • PORT it into the localized file (the usual answer), or",
    "  • if it cannot be ported — e.g. it fixed English to match a translation that was",
    "    already right — add it to NOT_A_PORT in locale-drift.test.mjs WITH A REASON.",
  ].join("\n");
}
