// ─────────────────────────────────────────────────────────────────────────────
// update-mode.mjs — "is this an update, or a self-heal?", asked ONE way (T8).
//
// The engine reaches a deployed brain by two doors. An UPDATE runs from a freshly
// fetched launcher and may deliver, merge and retire. A SELF-HEAL (ADR 0026) runs at
// SessionStart with the brain as its own source, and must do neither of the two acts
// it cannot take back:
//   • `retireDeclaredSkills` — the ONE `rmSync` under the owner's `.claude/`;
//   • `fetchAncestors` — a `git fetch origin`, which aimed at the brain points engine
//     machinery at the owner's PRIVATE vault remote.
//
// 🚨 IT WAS SPELLED THREE WAYS, and two of them compared the raw strings. Measured on
// a fixture: spell `sourceDir` as `<brainDir>/` or `<brainDir>/.` and the gate opens —
// the skill is erased, and the self-heal child is spawned detached with
// `stdio: "ignore"`, so the report saying so goes nowhere at all. `reconcile-brain`'s
// own `--brainDir` / `--sourceDir` flags are the reachable surface; it stayed latent
// only because the two live call sites happen to pass the same variable twice.
//
// The deleted main-branch predecessor DID normalize. The weaker comparison was newly
// written exactly where the consequence had become "a directory erased" — which is why
// this module ships with a SCANNER as well as an answer: one spelling is only one
// spelling for as long as nothing lets a fourth in.
// ─────────────────────────────────────────────────────────────────────────────
import { resolve } from "node:path";

import { lineOf, stripComments } from "./source-scan.mjs";

// `resolve` and not `realpath`: it is pure, it needs no directory to exist yet, and it
// answers the question actually being asked — do these two spellings name one path.
// A symlinked brain would defeat it, and that is a deliberate limit rather than an
// oversight: `realpath` does I/O, throws on an absent path, and this predicate guards a
// hot path that must never fail towards "go ahead and delete".
export function isSelfHeal({ brainDir, sourceDir }) {
  return resolve(sourceDir) === resolve(brainDir);
}

// ── The scanner, and it is the same shape and the same argument as
// `engine-script-coupling.mjs`: a pure function over a source string, with one
// repo-wide fail-loud test next door.
//
// It looks for the two dirs compared TO EACH OTHER and to nothing else. A raw compare
// reads exactly like the safe one, which is what got it through review twice; a machine
// does not have that problem. The normalized form (`resolve(sourceDir) === …`, or a call
// to `isSelfHeal`) has a token between the operator and the identifier, so it never
// matches — the remedy is invisible to the scanner by construction, not by exemption.
const RAW_COMPARISON = /(?<![\w$])(sourceDir|brainDir)\s*(===|!==|==|!=)\s*(sourceDir|brainDir)(?![\w$])/g;

// Returns [{ line, text }] — one entry per raw comparison, in source order.
export function findRawDirComparisons(source) {
  const clean = stripComments(source);
  return [...clean.matchAll(RAW_COMPARISON)]
    .filter((match) => match[1] !== match[3])
    .map((match) => ({ line: lineOf(clean, match.index), text: match[0] }));
}
