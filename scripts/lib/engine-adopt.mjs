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
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readAnswers, recordAnswer, writeAnswers } from "./engine-answers.mjs";
import { safetyCommit } from "./engine-commit.mjs";
import { syncBaseTree } from "./engine-base-fs.mjs";
import { sidecarPath } from "./engine-base.mjs";
import { reseedBaseRefs, reseedProvenance } from "./engine-source.mjs";
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

// `{ adopted: true }`, or `{ adopted: false, blocked: <reason> }`. Every blocked reason
// leaves the brain EXACTLY as it was — file, sidecar, base, manifest and answers — so a
// caller that only checks `adopted` can never be halfway.
export function adoptCandidate({ brainDir, rel, decision, combined, git }) {
  const sidecar = join(brainDir, sidecarPath(rel));
  // No sidecar, no offer. This is reachable in ordinary life: the owner asks about a
  // file whose engine version has already been adopted, or whose update never ran here.
  if (!existsSync(sidecar)) return { adopted: false, blocked: "no-candidate" };
  const candidate = readFileSync(sidecar, "utf8");

  const { write, deliver } = planAdoption({ decision, candidate, combined });

  // Gated on the PLAN, not on the decision: what makes a marked merge dangerous is that
  // its bytes get used, either written to the file or recorded as the ancestor. "Keep
  // mine" does neither, and refusing it would trap the owner — declining is the one
  // answer that is always safe, and it is precisely what they are declining.
  if ((write !== undefined || deliver !== undefined) && isMarkedMerge(candidate)) {
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

  const manifestPath = join(brainDir, "engine-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

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
    syncBaseTree({ brainDir, manifest: advanced, provenance: advanced.provenance, deliveredFileMap });
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

  return { adopted: true };
}
