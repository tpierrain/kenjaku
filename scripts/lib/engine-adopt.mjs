// ─────────────────────────────────────────────────────────────────────────────
// engine-adopt.mjs — the owner's answer, applied to the disk (plan S10-5).
//
// Everything before this slice PREPARED a choice: S10-1 dropped the engine's version
// beside the owner's file, S10-2 gave the answer somewhere to live, S10-3 said it out
// loud, S10-4 made the destructive offer earn its write. This is where a choice
// becomes bytes — and it is the only module in the engine that writes a file because
// a HUMAN said so rather than because a rule concluded it.
//
// 🚨 THE ONE RULE, and § S10-5-0 measured why it is not obvious:
//
//        the disk takes what the OWNER chose; the base advances to the CANDIDATE.
//
// For *take the new one* those coincide, so the rule looks like a tautology. For
// *combine* they do not, and that is the whole point: recording the combination as
// the ancestor would make it read **untouched** at the next update — word for word
// `engine-merge-apply.mjs`'s reason for splitting `write` from `deliver` at row 8.
// And a combination is in **no** fingerprint table, ever, so unlike an adopted
// candidate it can never be rescued later by S7's heal. Get this wrong and the same
// file is raised at every release, forever.
//
// 🛑 THE MIRROR TRAP, on the offer that writes nothing: *keep mine* must NOT advance
// the base. Recording the candidate as the ancestor of a file the owner REFUSED would
// make the next three-way merge treat v5's text as the agreed common origin and fold
// it in silently — the same trap inverted, and worse than the freeze it replaces.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";

import { readAnswers, recordAnswer, writeAnswers } from "./engine-answers.mjs";
import { safetyCommit } from "./engine-commit.mjs";
import { syncBaseTree } from "./engine-base-fs.mjs";
import { sidecarPath } from "./engine-base.mjs";
import { reseedBaseRefs, reseedProvenance, selectMergeFiles } from "./engine-source.mjs";
import { installRef } from "./engine-version.mjs";

// PURE, and deliberately wearing `mergeVerdict`'s two words. This IS row 8's rule with
// a human where `git merge-file` usually stands; a second vocabulary for one rule is
// how the two paths would quietly drift apart.
//
// An absent key means "do nothing", never "do it with nothing" — which is why *keep
// mine* returns `{}` rather than `{ write: undefined }`.
export function planAdoption({ decision, candidate, combined }) {
  if (decision === "keep-mine") return {};
  if (decision === "take-theirs") return { write: candidate, deliver: candidate };
  if (decision === "combine") {
    // The one decision carrying bytes of its own. Without them the only thing left to
    // write would be the candidate — i.e. silently turning a combination into "take
    // the new one", on the offer the owner chose over that one on purpose.
    if (combined === undefined) throw new Error('adoption "combine" needs the combined bytes');
    return { write: combined, deliver: candidate };
  }
  // A decision this module does not know is a caller bug. The cheap wrong answer would
  // be to fall through to "keep mine": silent, plausible, and it would record an answer
  // the owner never gave.
  throw new Error(`unknown adoption decision: ${decision}`);
}

// 🛑 TWO DIFFERENT FILES WEAR THE `.new` SUFFIX, and S10-QA is what found it — on the
// real v3.6.0 tree, not by reasoning. A `preserve` drops the engine's CLEAN version
// there (rows 3 and 7). A CONFLICT drops a three-way merge carrying markers (row 9).
// And S7-5 made conflicts common exactly where S10 looks: a file edited before the
// release now has a FETCHABLE ancestor, so it reaches the merge path instead of being
// preserved — which is what the QA's own fixture turned out to do.
//
// Taking one blind would paste `<<<<<<<` into the live file and, worse, record the
// markers as the file's new ANCESTOR, so every later merge would diff against a corpse.
// A conflict has its own door in the report (the walkthrough offer); this refuses to be
// a second, silent one.
//
// Both markers are required, at line start: the opening alone would refuse a file that
// merely quotes one, and this seam must never block a legitimate adoption to feel safe.
const isMarkedMerge = (content) => /^<<<<<<</m.test(content) && /^>>>>>>>/m.test(content);

// 🚨 F2 — IS THIS A FILE THE ENGINE MAY OFFER AT ALL? `rel` arrives from the
// CONVERSATION (`update-engine/SKILL.md` documents `adopt-engine-file.mjs <file> …`, and
// an agent types the `<file>`), so it is the one input to this module nothing upstream
// has vetted. THREE questions, and no two of them collapse into one:
//
//   • IS IT SPELLED AS THE BRAIN SPELLS IT? The manifest, the sidecar, the provenance
//     entry and the base tree are all keyed by this exact string, so a rel that is not
//     already the canonical brain-relative POSIX path means the name the regime is asked
//     about is NOT the file that would be written. `.claude/skills/../../notes.md` lands
//     on `notes.md` and matches `.claude/skills/**` — because `**` compiles to `.*`,
//     which crosses `/`. This is the question that catches it, and it also disposes of an
//     absolute path (which `join` quietly re-roots inside the brain) and of a win32
//     spelling (which no manifest glob uses).
//   • DOES IT STAY IN THE BRAIN? Canonical is not the same as inside: `../elsewhere.md`
//     is its own canonical form. `relative()` rather than a string prefix, for the same
//     reason as the write guard's `brainRelative` — a sibling directory whose name merely
//     starts with the brain's is not inside it.
//   • IS IT ENGINE-OWNED? A path can pass both and still be `.env`, a vault note, or
//     `.engine-base/**` — the last being the exact path the write guard denies the agent,
//     because forging an ancestor destroys the owner's edit at the next update.
//
// 🚨 S9 (second pass) — `".."` IS ITS OWN CANONICAL FORM, and it answered every question
// above with a yes: it equals the rel it came from, it starts with no `../`, and it is not
// absolute. The only thing refusing it was `selectMergeFiles` — which is not a guard:
// `advanceRegimes` imports whatever globs the FETCHED engine declares, and `**` compiles
// to `^.*$`, which matches `".."`. One leading-wildcard merge glob in a future manifest
// would have re-opened the exact escape this function exists to close. Spelled out beside
// the prefix test rather than folded into a cleverer one: the two shapes are `..` and
// `../x`, and a reader has to see both.
//
// 🚨 S10 — AND ALL THREE QUESTIONS ARE LEXICAL. `relative()` and `join()` never touch the
// disk, so a rel can be canonical, inside the brain by spelling, and matched by a merge
// glob, while the directory it names is a SYMLINK pointing elsewhere — and `writeFileSync`
// follows it out of the brain. Only the filesystem can answer "does it stay in the brain?",
// so the fourth question asks it, and asks it last: it is the only one that costs I/O, and
// the three cheap ones have already thrown out everything malformed.
//
// Why here and not on the update path, which follows symlinks just the same: `rel` arrives
// from the CONVERSATION — an agent types it — and that is the whole reason this function
// exists. Engine writes elsewhere take their rels from the manifest. The day that stops
// being true, this check belongs lower.
function isAdoptable({ brainDir, rel, manifest }) {
  const canonical = relative(brainDir, join(brainDir, rel)).split("\\").join("/");
  if (canonical !== rel) return false;
  if (canonical === ".." || canonical.startsWith("../") || isAbsolute(canonical)) return false;
  if (selectMergeFiles(manifest, [rel]).length === 0) return false;
  return staysInBrainOnDisk({ brainDir, rel });
}

// The real path, resolved through every link on the way. Fails towards refusing: a path we
// cannot resolve at all is not a path we may write through, and the caller has a named
// refusal to hand back either way.
//
// The TARGET when it is there, its PARENT when it is not — the parent is what the write
// would be created in, and it is where a symlinked directory does its work. Both are
// checked when both exist, because either one alone leaves the other's link unresolved.
function staysInBrainOnDisk({ brainDir, rel }) {
  try {
    const root = realpathSync(brainDir);
    const target = join(root, rel);
    const escapes = (path) => {
      const back = relative(root, path);
      return back === ".." || back.startsWith(`..${sep}`) || isAbsolute(back);
    };
    if (escapes(realpathSync(dirname(target)))) return false;
    return !existsSync(target) || !escapes(realpathSync(target));
  } catch {
    return false;
  }
}

// `{ adopted: true }`, or `{ adopted: false, blocked: <reason> }`. Every blocked reason
// leaves the brain EXACTLY as it was — file, sidecar, base, manifest and answers — so a
// caller that only checks `adopted` can never be halfway.
export function adoptCandidate({ brainDir, rel, decision, combined, git }) {
  // 🛑 F9 — THE MANIFEST IS READ FIRST, and that ordering is the whole of the second
  // repair. It used to be parsed at the END, after the file had been overwritten and the
  // sidecar deleted: a manifest mid-edit then threw, the CLI exited 1, and exit 1 is what
  // `update-engine/SKILL.md` tells the agent means "nothing was touched" — over a brain
  // whose file was gone and whose offer had been destroyed with it. Read here, the throw
  // costs nothing but the answer, which is exactly what the contract promises.
  //
  // It is also what F2's guard needs in order to ask its second question, so the two
  // findings have one fix: ask everything before writing the first byte.
  //
  // 🛑 S6 (second pass) — AND THE THROW IS AN ANSWER, not an escape. Moving the read here
  // kept F9's promise and cost a sentence: the same brain, asked about a file with no
  // `.new` beside it, used to get the designed `no-candidate` refusal and now got a
  // `JSON.parse` stack trace, because `adopt-engine-file.mjs` calls this with no
  // try/catch. "I cannot read the record" is one of this function's outcomes like every
  // other refusal — named, with the brain left exactly as it was, and a sentence of its
  // own in the CLI. Do NOT move the read back down to buy this back.
  const manifestPath = join(brainDir, "engine-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return { adopted: false, blocked: "unreadable-manifest" };
  }
  // F2 — before the sidecar is even looked for: the existence of a `.new` beside a file
  // is not what makes it the engine's. Anyone can put one there, including a mistaken
  // agent relaying a path it half-heard.
  if (!isAdoptable({ brainDir, rel, manifest })) return { adopted: false, blocked: "not-adoptable" };

  const sidecar = join(brainDir, sidecarPath(rel));
  // No sidecar, no offer. This is reachable in ordinary life: the owner asks about a
  // file whose engine version has already been adopted, or whose update never ran here.
  if (!existsSync(sidecar)) return { adopted: false, blocked: "no-candidate" };
  const candidate = readFileSync(sidecar, "utf8");

  const plan = planAdoption({ decision, candidate, combined });
  const { write, deliver } = plan;

  // Gated on the PLAN, not on the decision: what makes a marked merge dangerous is that
  // its bytes get used, either written to the file or recorded as the ancestor. "Keep
  // mine" plans NOTHING — `{}` — and refusing it would trap the owner: declining is the
  // one answer that is always safe, and it is precisely what they are declining.
  //
  // Asked of the plan as a WHOLE rather than of its two keys, because the measurement
  // showed the two-key form was a branch no input could reach: `planAdoption` returns
  // `write` and `deliver` together or neither, so `write !== undefined || deliver !==
  // undefined` had an arm nothing could exercise — a survivor by construction, and a
  // reader would have to check `planAdoption` to learn that. An empty plan touches no
  // bytes; anything else touches the candidate's.
  if (Object.keys(plan).length > 0 && isMarkedMerge(candidate)) {
    return { adopted: false, blocked: "marked-candidate" };
  }

  if (write !== undefined) {
    // S10-4. The owner's current bytes go into history first, or this does not happen.
    const safety = safetyCommit({ git, rel });
    // 🛑 Recording the answer here would be the worst possible half-step: the session
    // nudge would go quiet about a file that never changed, which is the blind spot S10
    // exists to close, re-created by the machinery that closes it.
    if (!safety.proceed) return { adopted: false, blocked: safety.outcome };
    writeFileSync(join(brainDir, rel), write);
  }

  // A sidecar is an OPEN OFFER. Once a choice is made — including "keep mine" — leaving
  // it there is a claim about a decision already taken. (The engine also replaces a
  // stale one at the next update, S10-1, but that is a repair, not a licence to litter.)
  rmSync(sidecar);

  // 🛑 EVERYTHING BELOW IS PAST THE POINT OF NO RETURN: the owner's file is written and
  // their offer is gone. Declared here, outside the `deliver` branch, so every adopted
  // result has ONE shape — "keep mine" reads no file at all, and an absent key would make
  // a caller ask which of the two silences it was looking at.
  const unreadable = [];

  if (deliver !== undefined) {
    // One file, the existing recorders. `deliveredFileMap` is exactly what the update
    // hands them after a merge, so an adoption and a merge leave the brain in the same
    // shape — which is the point of not inventing a second mechanism here.
    const deliveredFileMap = { [rel]: deliver };
    const advanced = {
      ...manifest,
      provenance: reseedProvenance({ priorProvenance: manifest.provenance ?? {}, manifest, deliveredFileMap }),
      baseRefs: reseedBaseRefs({
        priorBaseRefs: manifest.baseRefs ?? {},
        manifest,
        deliveredFileMap,
        ref: installRef(manifest),
      }),
    };
    writeFileSync(manifestPath, `${JSON.stringify(advanced, null, 2)}\n`);
    // 🛑 T5 — THE COLLECTOR IS NOT OPTIONAL HERE, because this call is PAST THE POINT OF
    // NO RETURN. By now the owner's file has been overwritten and their sidecar — the open
    // offer — destroyed. Without it, one merge file the process cannot read (a bad umask, a
    // cloud client's placeholder; `.claude/settings.json` is gitignored on every machine)
    // threw an EACCES straight out of the CLI, which exits 1 — and `update-engine/SKILL.md`
    // documents exit 1 to the agent as *"nothing was touched … do not run it again"*.
    // Measured as a process: file overwritten, offer gone, manifest rewritten, and the
    // answer NOT recorded, so the nudge went on offering a file already adopted while the
    // owner was told nothing had happened. It contradicted this function's own contract,
    // fifty lines up, verbatim.
    //
    // The names are RETURNED rather than dropped on the floor, for the reason T3's
    // reconcile returns its own: a caller reading a list has no way to tell a file that
    // was set aside from one that was never there. It is not the alarm — that voice
    // belongs to the health probe (`engineFilesVerdict`) — it is the record that the
    // adoption's own bookkeeping is one file short, and the next update re-attempts it
    // for free.
    syncBaseTree({ brainDir, manifest: advanced, provenance: advanced.provenance, deliveredFileMap, unreadable });
  }

  writeAnswers({
    brainDir,
    answers: recordAnswer({
      answers: readAnswers({ brainDir }),
      rel,
      decision,
      // The version the answer was given AGAINST — the key that makes a new release
      // re-open the question with no timer and no rule (`engine-answers.mjs`).
      ref: installRef(manifest),
    }),
  });

  return { adopted: true, unreadable };
}
