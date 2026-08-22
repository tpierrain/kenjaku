// ─────────────────────────────────────────────────────────────────────────────
// skill-retirement-fs.mjs — THE THIN I/O around the pure decision (plan S6c).
// It lists the declared directory, hands the bytes to `decideSkillRetirement`, and
// is the ONE place in this product that calls `rmSync` on something under the
// owner's `.claude/`. Everything that DECIDES lives next door and touches no disk;
// what is here is deliberately dumb, because the interesting half must stay
// testable without a brain and this half must stay easy to read in a review.
//
// The pure/fs split is the house pattern (`engine-base.mjs` / `engine-base-fs.mjs`),
// and it earns its keep loudest here: a delete is the one write no test should have
// to trust a double about.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { listFilesRelPosix } from "./fs-walk.mjs";
import { decideSkillRetirement } from "./skill-retirement.mjs";

// ".claude/skills/tdd-discipline/**" → ".claude/skills/tdd-discipline". The same strip
// the install-if-absent loop does, and for the same reason: a skill is retired at the
// DIRECTORY level, never file by file — half a skill left behind is worse than all of it.
const skillDirOf = (glob) => glob.replace(/\/\*\*?$/, "");

export function retireDeclaredSkills({ brainDir, sourceDir, plan, provenance = {} }) {
  const skillsRetired = [];
  const skillsRetirePreserved = [];

  // 🚨 F3 (v5.0.0 code review) — RETIREMENT IS AN UPDATE-TIME ACT, and this was the one
  // family beside the three merge families that did not say so. Left ungated it also ran
  // at SessionStart self-heal (`sourceDir === brainDir`), which is spawned DETACHED with
  // `stdio: "ignore"` — so `skillsRetired` goes to nowhere at all. And provenance entries
  // are never pruned, so a skill the owner went and RESTORED from their git history still
  // matched its recorded digest: deleted again at the next session start, in silence.
  //
  // The gate lives HERE and not at the call site, for the reason `fetchAncestors` gives
  // for the same choice: this is the one place in the product that calls `rmSync` under
  // the owner's `.claude/`, so no caller should have to remember. And an ABSENT
  // `sourceDir` is caught by the same line, deliberately — a caller who has not said this
  // is an update has not earned a deletion, and "I cannot tell" must fail towards keeping.
  if (sourceDir === undefined || sourceDir === brainDir) return { skillsRetired, skillsRetirePreserved };

  for (const glob of plan.retireSkills) {
    const dir = skillDirOf(glob);
    const abs = join(brainDir, dir);
    // An absent directory reads as an empty listing rather than as a special case: the
    // decision already has a word for it (`absent`), and giving the I/O a second opinion
    // on the same question is how two answers start to disagree.
    const files = existsSync(abs)
      ? listFilesRelPosix(abs).map((rel) => ({ rel: `${dir}/${rel}`, content: readFileSync(join(abs, rel), "utf8") }))
      : [];
    const decision = decideSkillRetirement({ dir, files, provenance });
    const name = dir.split("/").pop();

    // The whole directory, not the files we just listed: a leftover empty tree would
    // still read as an installed skill to the next `existsSync` guard (and there is one
    // in the install-if-absent loop), so a half-removal is a skill that never comes back.
    if (decision.verdict === "remove") {
      // `force` survives every mutation run and always will: we only get here when the
      // listing found files, so the path exists. What it covers is the one case no test
      // can stage deterministically — the owner deleting the folder in their file manager
      // between our listing and this line. An update that throws there strands the brain
      // mid-pass over a directory that is already gone, which is the outcome the whole
      // fail-soft habit of this codebase exists to avoid. Kept, and recorded as an
      // unkillable equivalent rather than defended by a test that would have to lie.
      rmSync(abs, { recursive: true, force: true });
      skillsRetired.push(name);
    } else if (decision.verdict === "preserve") {
      skillsRetirePreserved.push({ name, blockers: decision.blockers });
    }
    // `absent` falls through into NEITHER list, deliberately: it is the commonest case in
    // the fleet, and an owner told "preserved tdd-discipline" about a skill they never
    // installed would go looking for something that was never there.
  }

  return { skillsRetired, skillsRetirePreserved };
}
