#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// known-source.mjs — run FROM the brain folder to ask the vault ONE question,
// before capturing anything from an external source (ADR 0041):
//
//   "does this brain already hold this mail / message / event / document?"
//
//   node scripts/known-source.mjs --key "slack|C0CEQ4R5E|1725283200.001200"
//   node scripts/known-source.mjs --type slack --channel C0CEQ4R5E --ts 1725283200.001200
//   node scripts/known-source.mjs --type mail --from "Billing <b@example.com>" \
//        --date 2026-09-02T16:19:32Z --subject "Your invoice is ready"
//
// The raw fields a connector handed back go in; the KEY is composed here, because
// normalizing it is the deterministic side's job and not the model's (ADR 0009).
// Same shape as the check the `/switch` skill already calls
// (`set-universe-profile.mjs --check-slack`): pre-authorized, greppable, testable.
//
// THREE exit codes, and the third is the safety of the whole thing:
//   0 — not held, or could not find out → capture.
//   1 — already held → open the note it names, answer from it, enrich it.
//   2 — the question itself is broken (unknown type, missing field, malformed key).
//
// A caller that tested only "non-zero" would let a typo in its own arguments cancel
// a real capture — a silent loss, the one direction ADR 0041 §5 forbids. Hence 2,
// and hence the refusal going to stderr while an ANSWER always goes to stdout.
//
// It reads the NOTES, never the index: a note that arrived over git seconds ago is
// not indexed yet, and that is exactly the case this check exists for.
// ─────────────────────────────────────────────────────────────────────────────
import { join } from "node:path";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { isSourceKey, notesHoldingSource, sourceKey } from "./lib/source-key.mjs";
import { readVaultNotes } from "./lib/wiki-lint-io.mjs";

const USAGE =
  `usage: known-source.mjs --key "<source key>"\n` +
  `   or: known-source.mjs --type <slack|calendar|drive|notion|mail> --<field> <value> …\n` +
  `       (slack: --channel --ts · calendar: --event · drive: --file · notion: --page\n` +
  `        mail: --from --date --subject)`;

export const realKnownSourceDeps = {
  // The whole vault, universes included (ADR 0034) — a check blind to a universe
  // subtree would answer "never seen" for every source that universe already holds.
  notes: () => readVaultNotes(join(process.cwd(), "vault")),
  log: (...a) => console.log(...a),
  error: (...a) => console.error(...a),
};

/** `["--type", "mail", "--from", "x"]` → `{ type: "mail", from: "x" }`. A flag with no value is a broken question. */
function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].startsWith("--") ? argv[i].slice(2) : null;
    if (!name) throw new Error(`unexpected argument ${JSON.stringify(argv[i])}.\n${USAGE}`);
    if (i + 1 >= argv.length) throw new Error(`--${name} needs a value.\n${USAGE}`);
    flags[name] = argv[++i];
  }
  return flags;
}

// The key the caller asked about: either handed over ready-made, or composed here
// from the connector's raw fields. Both paths end at the same normalizer, so the
// two doors cannot answer differently about one source.
function keyFrom(flags) {
  if (flags.key !== undefined) {
    if (!isSourceKey(flags.key)) {
      throw new Error(
        `${JSON.stringify(flags.key)} is not a source key. Compose one from the connector's own ` +
          `fields instead: --type <…> --<field> <value> … — a key nothing can match is worse than none.`,
      );
    }
    return flags.key;
  }
  if (flags.type === undefined) throw new Error(`nothing to look up.\n${USAGE}`);
  return sourceKey(flags);
}

/** Answers the question. Returns the process exit code: 0 not held / 1 held / 2 broken question. */
export function runKnownSource(argv, deps = realKnownSourceDeps) {
  let key;
  try {
    key = keyFrom(parseFlags(argv));
  } catch (err) {
    deps.error(`✗ ${err.message}`);
    return 2;
  }

  // An unreadable vault is "I could not find out", and the safe answer to that is to
  // capture: a duplicate is greppable and removable, a capture skipped by mistake is
  // invisible from inside the vault. Fail towards the nuisance, never towards the loss.
  let holders;
  try {
    holders = notesHoldingSource(deps.notes(), key);
  } catch (err) {
    deps.log(`? could not find out — the vault could not be read (${err.message}). Treat ${key} as UNKNOWN and capture.`);
    return 0;
  }

  if (holders.length === 0) {
    deps.log(`✓ not held — ${key} appears in no note yet.`);
    return 0;
  }
  deps.log(
    `✗ already held — ${key} is listed by ${holders.map((p) => `vault/${p}`).join(", ")}. ` +
      `Read that note and enrich it if your question needs more; do not capture it a second time.`,
  );
  return 1;
}

runAsEntrypoint(import.meta.url, process.argv, runKnownSource);
