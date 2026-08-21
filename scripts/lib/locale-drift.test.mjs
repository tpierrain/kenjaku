import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  parseCommits,
  unpairedCommits,
  describeDrift,
  defaultLog,
  localeDriftPairs,
  measureLocaleDrift,
} from "./locale-drift.mjs";
import { buildGitInvocation } from "./engine-fetch.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// THE EN/FR DRIFT GUARD (plan S8-2).
//
// 🚨 THE RISK, named in the design before the code: the French tree falls behind
// its English source and NOTHING says a word. Measured by hand in conversation —
// and the hand measurement was WRONG, which is the whole argument for a test.
//
// THE CRITERION is *unpaired commits*: commits touching `<rel>` since the FR twin's
// own last commit that do not ALSO touch `templates/fr/<rel>`. The obvious signal
// ("commits on EN since the twin's date") reads 1 for a perfectly-synchronised pair,
// because a pair updated in ONE shared commit contains that commit in its own
// window: 14 of the 16 real pairs scored 1 and every one was in sync.
//
// It judges NO translation quality. It makes the omission impossible not to see.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ───────────────────────────────────────────────────────────────────────────
// 🛡️ THE WAIVER MAP — and it is deliberately HERE, in the guard's own test file,
// so adding one is a reviewed code change that carries its justification, never a
// config line somebody edits to make a build go green.
//
// WHY IT HAS TO EXIST: the criterion cannot see DIRECTION. A commit that brings
// ENGLISH up to FRENCH's standard is unpaired forever, because the correct French
// edit is *no edit*. Without this map, `prepare-1-1` is a permanent red that no
// amount of translating can ever clear — measured on 2026-08-21, one iteration
// after the criterion was designed, by reading the commit instead of trusting the
// criterion that selected it.
//
// ⚠️ A waiver list is how a guard dies. Each entry is a claim someone must be able
// to check, and a map that keeps growing is a signal to re-examine the criterion,
// not an invitation to keep typing.
// ───────────────────────────────────────────────────────────────────────────
const NOT_A_PORT = {
  f7a00fc:
    "EN-only by its own commit message, fixing English to match an FR sibling " +
    "'which had it right' — the blank line is already there in the French file.",
};

test("parseCommits reads the sha and the subject of every line", () => {
  const parsed = parseCommits("435c164\tfeat(sync): a universe\n8341e18\tdocs: the pointer\n");

  assert.deepEqual(parsed, [
    { sha: "435c164", subject: "feat(sync): a universe" },
    { sha: "8341e18", subject: "docs: the pointer" },
  ]);
});

test("parseCommits keeps a subject that itself contains the separator", () => {
  // The split is on the FIRST tab, not the last: a subject is free-form text and a
  // tab inside it must not eat the front of the message.
  assert.deepEqual(parseCommits("a1b2c3d\tfix: before\tafter"), [
    { sha: "a1b2c3d", subject: "fix: before\tafter" },
  ]);
});

test("parseCommits reads no commit out of the empty output git gives for an untouched file", () => {
  assert.deepEqual(parseCommits(""), []);
  assert.deepEqual(parseCommits("\n"), []);
});

test("parseCommits survives an ABSENT payload rather than inventing a commit from it", () => {
  assert.deepEqual(parseCommits(undefined), []);
  assert.deepEqual(parseCommits(null), []);
});

test("unpairedCommits keeps only what touched EN without touching the twin", () => {
  const commits = [
    { sha: "aaa1111", subject: "shared: both sides in one commit" },
    { sha: "bbb2222", subject: "en only: a real drift" },
    { sha: "ccc3333", subject: "shared again" },
  ];

  assert.deepEqual(unpairedCommits({ commits, pairedShas: ["ccc3333", "aaa1111"], waived: {} }), [
    { sha: "bbb2222", subject: "en only: a real drift" },
  ]);
});

test("unpairedCommits drops a waived sha, and ONLY the waived one", () => {
  const commits = [
    { sha: "f7a00fc", subject: "fix: EN catches up with FR" },
    { sha: "ddd4444", subject: "en only: not waived" },
  ];

  assert.deepEqual(
    unpairedCommits({ commits, pairedShas: [], waived: { f7a00fc: "EN caught up with FR" } }),
    [{ sha: "ddd4444", subject: "en only: not waived" }],
  );
});

test("unpairedCommits reports everything when nothing is paired and nothing is waived", () => {
  const commits = [
    { sha: "eee5555", subject: "one" },
    { sha: "fff6666", subject: "two" },
  ];

  assert.deepEqual(unpairedCommits({ commits, pairedShas: [], waived: {} }), commits);
});

test("describeDrift prints the WHOLE message: the subjects, and both ways to clear a hit", () => {
  // Asserted whole rather than by fragments. Two reasons, both learned by measurement:
  // a `match` on one line lets every OTHER line be emptied without a test noticing, and
  // this message IS the feature — subjects because a count cannot carry magnitude
  // (`sync` and `prepare-1-1` both scored 1, one was a third of the file and the other a
  // one-line review fix), and BOTH remedies because a guard that only says "port it"
  // gets deleted the day a hit is legitimately unportable.
  const message = describeDrift([
    {
      rel: ".claude/skills/sync/SKILL.md",
      sourcePath: "templates/fr/.claude/skills/sync/SKILL.md",
      commits: [{ sha: "435c164", subject: "feat(sync): a universe arriving mid-session" }],
    },
  ]);

  assert.equal(
    message,
    [
      "1 localized file(s) behind their English source:",
      "  templates/fr/.claude/skills/sync/SKILL.md is behind .claude/skills/sync/SKILL.md:",
      "    435c164 feat(sync): a universe arriving mid-session",
      "",
      "Two ways to clear each commit, and only two:",
      "  • PORT it into the localized file (the usual answer), or",
      "  • if it cannot be ported — e.g. it fixed English to match a translation that was",
      "    already right — add it to NOT_A_PORT in locale-drift.test.mjs WITH A REASON.",
    ].join("\n"),
  );
});

test("describeDrift lists every drifting pair and every commit, not just the first of each", () => {
  const message = describeDrift([
    {
      rel: "a.md",
      sourcePath: "templates/fr/a.md",
      commits: [
        { sha: "aaa1111", subject: "one" },
        { sha: "ccc3333", subject: "three" },
      ],
    },
    { rel: "b.md", sourcePath: "templates/fr/b.md", commits: [{ sha: "bbb2222", subject: "two" }] },
  ]);

  assert.equal(
    message.split("\n").slice(0, 5).join("\n"),
    [
      "2 localized file(s) behind their English source:",
      "  templates/fr/a.md is behind a.md:",
      "    aaa1111 one",
      "    ccc3333 three",
      "  templates/fr/b.md is behind b.md:",
    ].join("\n"),
  );
});

test("defaultLog hands git a BUILT invocation and trims what comes back", () => {
  // The invocation is a value handed to a thin runner (CONVENTIONS §5ter, debt 2 of the
  // v4.8.0 pass) — and it is `engine-fetch`'s builder, not a second spelling of "ask git".
  const seen = [];
  const out = defaultLog(["log", "-1"], (command, args, options) => {
    seen.push({ command, args, options });
    return "  435c164\tfeat: a fingerprint  \n";
  });

  assert.equal(out, "435c164\tfeat: a fingerprint");
  assert.deepEqual(seen, [buildGitInvocation(["log", "-1"])]);
});

test("localeDriftPairs derives a pair only where BOTH sides exist, in any locale, in a stable order", () => {
  // ⚠️ The input is deliberately UNSORTED and puts fr BEFORE es: with a pre-sorted
  // fixture, dropping the sort entirely still passes, and the report's order — which
  // is what a human diffs between two runs — stops being asserted at all.
  assert.deepEqual(
    localeDriftPairs([
      "templates/fr/orphan.md",
      "b.md",
      "templates/fr/a.md",
      "no-twin.md",
      "a.md",
      "templates/es/a.md",
    ]),
    [
      { sourcePath: "templates/es/a.md", locale: "es", rel: "a.md" },
      { sourcePath: "templates/fr/a.md", locale: "fr", rel: "a.md" },
    ],
  );
});

test("localeDriftPairs anchors on templates/ at the START of the path", () => {
  // `docs/templates/fr/nested.md` is a document ABOUT the templates, not a twin of
  // `nested.md`. Without the anchor it would silently join the watched set and report
  // drift against a file it has nothing to do with.
  assert.deepEqual(localeDriftPairs(["nested.md", "docs/templates/fr/nested.md"]), []);
});

test("measureLocaleDrift pairs a twin with its source, and asks git the right three questions", () => {
  const asked = [];
  const git = (args) => {
    asked.push(args);
    if (args[1] === "-1") return "TWIN_SHA";
    if (args.at(-1) === "templates/fr/a.md") return "aaa1111\tshared\n";
    return "aaa1111\tshared\nbbb2222\ten only\n";
  };

  const drift = measureLocaleDrift({
    sourceFiles: ["a.md", "templates/fr/a.md"],
    waived: {},
    git,
  });

  assert.deepEqual(drift, [
    {
      rel: "a.md",
      sourcePath: "templates/fr/a.md",
      commits: [{ sha: "bbb2222", subject: "en only" }],
    },
  ]);
  // The window is opened at the TWIN's own last commit — a fingerprint of the first
  // answer, so a later call cannot silently stop using it.
  assert.ok(
    asked.some((args) => args.includes("TWIN_SHA..HEAD")),
    `no call scoped to the twin's commit: ${JSON.stringify(asked)}`,
  );
});

test("measureLocaleDrift returns nothing for a pair whose commits all touched both sides", () => {
  const git = (args) => {
    if (args[1] === "-1") return "TWIN_SHA";
    return "aaa1111\tshared\n";
  };

  assert.deepEqual(
    measureLocaleDrift({ sourceFiles: ["a.md", "templates/fr/a.md"], waived: {}, git }),
    [],
  );
});

test("measureLocaleDrift ignores a localized file that has NO English source", () => {
  // A rel is locale-owned iff its twin exists (`engine-copy-select.mjs`). The mirror
  // case — an English file with no twin — means the product did not localize it, and
  // reporting it would flood the output with every English file forever.
  const git = () => {
    assert.fail("git must not be asked about a file with no pair");
  };

  assert.deepEqual(
    measureLocaleDrift({ sourceFiles: ["templates/fr/orphan.md", "no-twin.md"], waived: {}, git }),
    [],
  );
});

test("measureLocaleDrift covers every locale, not just fr", () => {
  const git = (args) => {
    if (args[1] === "-1") return "TWIN";
    return args.at(-1).startsWith("templates/") ? "" : "ccc3333\tboth locales behind\n";
  };

  const drift = measureLocaleDrift({
    sourceFiles: ["a.md", "templates/fr/a.md", "templates/es/a.md"],
    waived: {},
    git,
  });

  assert.deepEqual(
    drift.map((d) => d.sourcePath).sort(),
    ["templates/es/a.md", "templates/fr/a.md"],
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// THE GUARD ITSELF — against the real repository.
// ═══════════════════════════════════════════════════════════════════════════

test("no French twin has fallen behind its English source", () => {
  const sourceFiles = execFileSync("git", ["ls-files"], { cwd: REPO_ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

  const drift = measureLocaleDrift({ sourceFiles, waived: NOT_A_PORT });

  assert.deepEqual(drift, [], describeDrift(drift));
});

test("the guard is watching the pairs it is supposed to watch", () => {
  // Without this, the guard above passes just as well when the derivation breaks and
  // it watches NOTHING at all — the failure mode of every "assert empty" test.
  const sourceFiles = execFileSync("git", ["ls-files"], { cwd: REPO_ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

  const watched = localeDriftPairs(sourceFiles).map((pair) => pair.sourcePath);

  assert.ok(watched.length >= 16, `only ${watched.length} pairs derived, expected at least 16`);
  assert.ok(
    watched.includes("templates/fr/.claude/skills/sync/SKILL.md"),
    "the pair the whole slice was measured on is not in the watched set",
  );
});

test("every waived sha is a real commit that is still reachable", () => {
  // A waiver keyed on a sha that no longer exists is a silent hole: it waives nothing,
  // and nobody finds out until the pair it was covering drifts for a real reason.
  for (const sha of Object.keys(NOT_A_PORT)) {
    const subject = execFileSync("git", ["log", "-1", "--format=%s", sha], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim();
    assert.ok(subject.length > 0, `waived sha ${sha} resolves to no commit`);
  }
});

test("every waiver carries a reason a human can check", () => {
  for (const [sha, reason] of Object.entries(NOT_A_PORT)) {
    assert.ok(reason.length > 30, `waiver ${sha} has no usable justification: ${reason}`);
  }
});
