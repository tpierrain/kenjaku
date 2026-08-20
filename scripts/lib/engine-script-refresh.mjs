// ─────────────────────────────────────────────────────────────────────────────
// engine-script-refresh.mjs — the four engine-owned scripts stop being written
// blind (plan S2b-3). `auto-commit`, `auto-push`, `status-line` and `verify-rag`
// are declared `merge` in every manifest the product has ever shipped, and were
// applied by COPY: an owner who tuned their auto-commit lost the tuning at the
// next update, silently. This module routes them through the same three-way merge
// the skills got at S2, so both the owner's edit and the engine's fix land.
//
// Twin of `engine-skill-refresh.mjs`, and deliberately as thin: the DECISION is
// `engine-merge.mjs`'s nine rows, the JOURNEY to the disk is
// `engine-merge-apply.mjs`'s. What is genuinely this module's own is three things:
//   • WHICH files (top-level `scripts/*.mjs` the manifest declares `merge`);
//   • that a FILE is its own report entry (a script is not a subtree, unlike a
//     skill: "auto-commit kept your edits" names the file to go and look at);
//   • the SYNTAX GATE, which is why this is a module and not a second call to the
//     skills'. The brain EXECUTES these files — `auto-commit.mjs` runs at every
//     Stop hook. A textually clean merge that happens not to parse would leave a
//     brain that silently stops committing itself, which is worse than not having
//     merged at all. So a merge whose bytes do not parse is downgraded to
//     `merge-unsafe`: the working script stands, the candidate waits in `.new`.
// ─────────────────────────────────────────────────────────────────────────────
import { applyMergeGoverned } from "./engine-merge-apply.mjs";
import { selectMergeFiles } from "./engine-source.mjs";
import { parsesAsModule } from "./engine-script-check.mjs";

// An engine-owned script: a TOP-LEVEL `scripts/*.mjs`. Twin of `ENGINE_SCRIPT` in
// `engine-apply-plan.mjs`, which carves the same shape out of the copy plan — the
// two must agree, or a file would be delivered twice or not at all.
// `scripts/lib/**` is `replace` (engine internals, no owner ever edits them), and
// so is `scripts/update-engine.mjs` (the self-update path). Neither can reach this
// list, since the manifest never declares them `merge` — but the shape is what
// makes a FUTURE top-level script merge-governed just by being declared.
const ENGINE_SCRIPT = /^scripts\/[^/]+\.mjs$/;

// The source files eligible for a merge-governed refresh: those the manifest
// DECLARES engine-owned AND that have this shape. An intersection with what the
// source actually ships, never a replay of the manifest: a brain whose manifest
// still names a script the engine has since retired must not be asked to read it.
export function selectMergeGovernedScripts({ sourceFiles, manifest }) {
  return selectMergeFiles(manifest, sourceFiles).filter((rel) => ENGINE_SCRIPT.test(rel));
}

// ─── The scripts' wiring onto the shared carrier ─────────────────────────────
// `merge` carries no default (the carrier owns it, one owner per default), but
// `verifyWrite` DOES default here: it is not a caller's option, it is what makes
// this family different from the skills'. A caller that forgets it is a caller
// that ships a brain whose Stop hook no longer parses.
export function refreshEngineScripts({
  brainDir,
  sourceDir,
  sourceFiles,
  manifest,
  provenance = {},
  merge,
  verifyWrite = ({ content }) => parsesAsModule({ source: content }),
}) {
  const { refreshed, preserved, merged, conflicts, deliveredFileMap } = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles,
    pairs: selectMergeGovernedScripts({ sourceFiles, manifest }).map((rel) => ({ rel, sourceRel: rel })),
    provenance,
    merge,
    // A script IS the subject: no grouping, the path is what the owner opens.
    groupOf: (rel) => rel,
    verifyWrite,
  });
  return {
    scriptsRefreshed: refreshed,
    scriptsPreserved: preserved,
    scriptsMerged: merged,
    scriptConflicts: conflicts,
    refreshedFileMap: deliveredFileMap,
  };
}
