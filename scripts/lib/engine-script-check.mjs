// ─────────────────────────────────────────────────────────────────────────────
// engine-script-check.mjs — the SYNTAX GATE on merged bytes (plan S2b-2), and
// the second impure seam of S2 after `engine-merge-git.mjs`.
//
// S2b merges files the brain EXECUTES. A conflict is never written (verdict row
// 9), so markers can never land — but a CLEAN line-based merge of two valid edits
// can still produce bytes that parse to nothing, and those bytes exist nowhere
// but that one machine: no engine test ever ran them. A broken `SKILL.md`
// degrades an answer; a broken `auto-commit.mjs` silently stops committing the
// brain, which is the product's whole promise.
//
// So the merge OUTPUT is parsed before it is written, and ONLY the merge output:
// a fast-forward writes the engine's own candidate, which the suite already
// tested. This gate is for bytes the engine has never seen.
//
// ⚠️ It catches SYNTAX, not sense — `require("fs")` inside an `.mjs` parses fine
// and throws at runtime. Judging whether a merged script still BEHAVES is a
// different product; the answer to that is the conflict report.
// ─────────────────────────────────────────────────────────────────────────────
import { spawnSync } from "node:child_process";

// The flags are a contract, not decoration. Without `--input-type=module` node
// parses the source as CommonJS, where `import` is a syntax error and every engine
// script would be judged broken; without the `-` node has no input at all.
export const SYNTAX_CHECK_ARGS = ["--check", "--input-type=module", "-"];

// The request as a VALUE (CONVENTIONS.md §5ter), never composed at the call site.
// No default for `nodeBin`: one owner per default, and it is `parsesAsModule` below.
export function buildSyntaxCheckInvocation({ source, nodeBin }) {
  return {
    command: nodeBin,
    args: [...SYNTAX_CHECK_ARGS],
    options: { encoding: "utf8", input: source },
  };
}

// True iff `source` parses as an ES module. `nodeBin` defaults to the brain's OWN
// interpreter: the gate must run under the same engine that will later load the
// file, or a brain on an older node is told its files are fine by a parser it
// never runs.
//
// 🛑 A gate that CANNOT RUN throws; it never answers "unsafe". A false unsafe
// preserves a file for ever and tells the owner their merge is broken when it is
// the tool that is — the same contract, and the same reason, as `mergeWithGit`.
// Only 0 and 1 are answers: every other code means node itself is unhappy (an
// unknown flag exits 9), and read as a verdict a 9 would condemn a good file.
export function parsesAsModule({ source, nodeBin = process.execPath, run = spawnSync }) {
  const { command, args, options } = buildSyntaxCheckInvocation({ source, nodeBin });
  const result = run(command, args, options);
  if (result.error) throw new Error(`${command} --check could not run: ${result.error.message}`);
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`${command} --check could not run: unexpected exit status ${result.status}`);
  }
  return result.status === 0;
}
