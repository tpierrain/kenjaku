#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// adopt-engine-file.mjs — the command behind the three offers (plan S10-6a).
//
// WHY THIS FILE EXISTS, and it is not a detail of packaging: S10-5 built the
// adoption seam as a FUNCTION, and the conversation that asks the question is a
// SKILL. A skill cannot call a function — it can only run a command. Without this
// file the prose of S10-6 could describe a capability and never reach it, which is
// the shape of promise this whole release exists to stop making.
//
//   node scripts/adopt-engine-file.mjs <file> take-theirs
//   node scripts/adopt-engine-file.mjs <file> keep-mine
//   node scripts/adopt-engine-file.mjs <file> combine --from <path>
//
// 🧭 WHY `combine` TAKES A PATH AND NOT THE TEXT. The combination is written by
// Claude, reading both versions — that is brick 4, and it is the one offer no
// merge engine can produce without an ancestor. It arrives as a file because a
// document of any size does not survive being an argv entry, and because the bytes
// adopted must be exactly the bytes reviewed.
//
// 🚨 THE EXIT CODES CARRY THE DISTINCTION THE CONVERSATION TURNS ON:
//   0 — applied.
//   1 — REFUSED, brain untouched. Every reason needs a HUMAN (a git identity, a
//       merge to finish, an offer already taken). Relay it; do not retry.
//   2 — the CALLER got it wrong. Never shown to the owner as-is.
// Collapsing 1 and 2 into "it failed" would erase whether the person watching has
// anything to do about it.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";

import { buildGit, repoRoot } from "./auto-commit.mjs";
import { adoptCandidate } from "./lib/engine-adopt.mjs";
import { ADOPTION_BLOCKED_LINE } from "./lib/engine-commit.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

export const USAGE =
  "usage: node scripts/adopt-engine-file.mjs <file> take-theirs|keep-mine|combine [--from <path>]\n" +
  "  take-theirs   the engine's newer version replaces yours (your current one is saved first)\n" +
  "  keep-mine     your version stands, and the engine stops asking about it until the next release\n" +
  "  combine       adopt the combination written in --from, keeping the engine's version as the ancestor";

// The one blocked outcome with no sentence in `engine-commit.mjs`: that map covers
// the safety commit's refusals, and this is not one. It is not an error either —
// it is what the owner hears when the offer was already taken, or never made here.
// A conflict's sidecar is a three-way merge carrying markers, not the engine's clean
// version (S10-QA). Two things this sentence must do: NOT say "nothing to adopt", which
// was where an unknown reason used to fall through, and name the offer that does work —
// combining, because the person writing it reads both sides instead of copying one.
const MARKED_CANDIDATE_LINE = (rel) =>
  `I left ${rel} exactly as it is: your version and the engine's changed the same lines,` +
  ` so what is waiting beside it is a marked-up merge of both, not a version anyone should` +
  ` install as-is. Ask me to combine the two and I'll write the merged version with you.`;

// F2 — the path was not one the engine has anything to say about: it left the brain, it
// was not spelled as the brain spells its own files, or no engine regime names it (`.env`,
// a vault note, a recorded ancestor). Written for the AGENT relaying it as much as for the
// owner, because that is who got it wrong: the remedy is to name the file the report
// named, not to try again.
const NOT_ADOPTABLE_LINE = (rel) =>
  `${rel} is not a file the engine offers you, so I left everything exactly as it is.` +
  ` Adoption only ever applies to the engine's own files, named as they appear in your` +
  ` update report — not to your notes, your keys, or a path outside this brain.`;

const NO_CANDIDATE_LINE = (rel) =>
  `There is no newer version waiting beside ${rel}, so there is nothing to adopt —` +
  ` your file stands exactly as it is. Either this choice was already made, or this` +
  ` brain never received an engine version of that file to compare against.`;

// S6 — the record itself is unreadable (missing, or caught mid-write by a sync). Nothing
// about it is the owner's doing and nothing about it is their file's fault, so the
// sentence blames neither: it names `engine-manifest.json`, says the brain was left alone,
// and points at the one thing that repairs it. Deliberately NOT the no-candidate story
// ("there is no newer version waiting") — there may well be one, and we cannot see it.
const UNREADABLE_MANIFEST_LINE = (rel) =>
  `I could not read this brain's engine-manifest.json, so I left ${rel} and everything else` +
  ` exactly as it is. That file is the engine's own record of what it delivered; if a sync` +
  ` caught it mid-write, opening a new session repairs it, and it is restorable from this` +
  ` brain's git history.`;

// One sentence per blocked reason, and NO fallback on purpose. A `??` stood here and
// quietly handed every unknown reason the no-candidate sentence — so the day the seam
// learned a fourth refusal, the owner was told "there is no newer version waiting" about
// a file that had one. A missing key must be a crash in a test, not a lie in production.
const BLOCKED_LINE = {
  ...ADOPTION_BLOCKED_LINE,
  "no-candidate": NO_CANDIDATE_LINE,
  "marked-candidate": MARKED_CANDIDATE_LINE,
  "not-adoptable": NOT_ADOPTABLE_LINE,
  "unreadable-manifest": UNREADABLE_MANIFEST_LINE,
};

const APPLIED_LINE = {
  "take-theirs": (rel) =>
    `Done: ${rel} is now the engine's newer version, and your previous one is saved in this brain's history.`,
  "keep-mine": (rel) =>
    `Done: ${rel} stays exactly as you wrote it. The engine will not raise it again until its next release.`,
  combine: (rel) =>
    `Done: ${rel} now holds the combination, and the engine's version is recorded as its ancestor` +
    ` — so your next update merges from there instead of asking again.`,
};

// The `-1` guard is load-bearing, not ceremony: without it `rest[at + 1]` reads
// `rest[0]` when `--from` is absent, so a stray argument would be silently promoted
// to "the combination", and the owner would be told a file they never named could
// not be read.
function fromPath(rest) {
  const at = rest.indexOf("--from");
  return at === -1 ? undefined : rest[at + 1];
}

// Everything reaches this through `deps`, so the whole decision is testable without
// a brain, a repo, or a git identity.
export const realDeps = () => {
  const brainDir = repoRoot(import.meta.url);
  return {
    brainDir,
    adopt: (args) => adoptCandidate({ ...args, git: buildGit(brainDir) }),
    log: (m) => console.log(m),
    error: (m) => console.error(m),
  };
};

export function runAdoptEngineFile(argv, deps = realDeps()) {
  const [rel, decision, ...rest] = argv;
  if (!rel || !decision) {
    deps.error(USAGE);
    return 2;
  }
  // 🛑 Everything below that returns 2 must do so BEFORE `adopt` is called. A usage
  // error that has already run a safety commit and rewritten a file is not a usage
  // error any more.
  if (!APPLIED_LINE[decision]) {
    deps.error(`I do not know the answer "${decision}".\n${USAGE}`);
    return 2;
  }

  let combined;
  if (decision === "combine") {
    const path = fromPath(rest);
    if (!path) {
      // Without its bytes, "combine" is one silent fallback away from becoming
      // "take the new one" — the offer the owner chose over that one on purpose.
      deps.error(`"combine" needs the combination itself: pass it with --from <path>.\n${USAGE}`);
      return 2;
    }
    try {
      combined = readFileSync(path, "utf8");
    } catch {
      deps.error(`I could not read the combination at ${path}, so I changed nothing.`);
      return 2;
    }
  }

  const { adopted, blocked } = deps.adopt({ brainDir: deps.brainDir, rel, decision, combined });
  if (adopted) {
    deps.log(APPLIED_LINE[decision](rel));
    return 0;
  }
  deps.error(BLOCKED_LINE[blocked](rel));
  return 1;
}

runAsEntrypoint(import.meta.url, process.argv, runAdoptEngineFile);
