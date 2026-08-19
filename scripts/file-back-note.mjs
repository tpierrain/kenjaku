#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// file-back-note.mjs — run FROM the brain folder to file a distilled answer back
// into the vault as a durable, taxonomy-conformant note (Axis 1, Track B).
//
// Deterministic, fail-loud, binary (ADR 0009): it reads a JSON filing spec on
// stdin, stamps today's date, and writes a note whose path + frontmatter + woven
// [[links]] are conformant BY CONSTRUCTION (so `/lint` stays green on it). It
// NEVER overwrites an existing note — filing back is additive; refining a living
// page is a confirmed, conversational gesture, not a silent clobber.
//
//   echo '<json spec>' | node scripts/file-back-note.mjs
//
// Spec: { type, title, tags[], body, links?[], date?, distinguish?, confidence? }
// — date is required for dated types (decision, meeting); `distinguish` is the
// homonymy block, and a person whose first name the vault already holds is
// REFUSED until it is given; `confidence` ({level, basis}) is what the card's
// identity rests on, and a person is REFUSED without it. Exits 0 when written,
// 1 when refused/error.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { renderFiledNote, homonymCards, CONFIDENCE } from "./lib/filed-note.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { readActiveUniverse, vaultRagDir } from "./lib/universes.mjs";

// Vault paths are displayed, compared and written in POSIX form so behaviour is
// identical across platforms — on Windows join() yields backslashes, which would
// break the string match against the vault path and the existence check. Cf.
// installer toPosix / document-scanner.
const toPosix = (p) => p.split("\\").join("/");

// Every `people/` card the vault holds, vault-relative: the root's cross-cutting
// ones AND each universe's own subtree — the same reach the identity discipline
// asks a resolution to read, so the guard sees what the reader would see. The
// listing is injected (`io.list` → [{ name, isDirectory }], empty when absent).
export function listPeopleCards(io, vaultDir) {
  const cards = [];
  const collect = (prefix) => {
    for (const entry of io.list(`${vaultDir}/${prefix}people`)) {
      if (!entry.isDirectory && entry.name.endsWith(".md"))
        cards.push(`${prefix}people/${entry.name}`);
    }
  };
  collect("");
  for (const entry of io.list(vaultDir)) {
    if (entry.isDirectory && entry.name !== "people") collect(`${entry.name}/`);
  }
  return cards;
}

// The real directory listing. A folder that is not there is "no cards", never a
// crash: a brain whose vault holds no people/ yet is the ordinary first-week
// state, and the guard must stay silent then rather than block every write.
export const realListIo = {
  list: (dir) => {
    try {
      return readdirSync(dir, { withFileTypes: true }).map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
      }));
    } catch {
      return [];
    }
  },
};

// Real wiring — the side effects, injected so runFileBack stays unit-testable.
export const realFileBackDeps = {
  cwd: () => process.cwd(),
  today: () => new Date().toISOString().slice(0, 10),
  // The active universe (ADR 0034): a filed-back answer lands in the universe you
  // are working in, so it stays on-scope for that universe's retrieval. Read from
  // the brain's .vault-rag pointer, anchored on cwd like the vault write path. A
  // default/single-universe brain reads back "default" → note stays at the root.
  // readFileSync as TEXT, not the raw Buffer form: the pointer reader trims what it
  // reads, and a Buffer has no .trim() (it threw on any brain past one universe).
  universe: () =>
    readActiveUniverse(
      { existsSync, readFileSync: (p) => readFileSync(p, "utf-8") },
      vaultRagDir(process.cwd()),
    ),
  readInput: () => readFileSync(0, "utf8"),
  exists: (p) => existsSync(p),
  // What the vault already says about who exists — read at write time, because
  // the model demonstrably does not check (a bare "Jérémy" became a surname that
  // exists nowhere else). POSIX-formed like the write path, for one comparison
  // shape across platforms.
  peopleCards: () => listPeopleCards(realListIo, toPosix(join(process.cwd(), "vault"))),
  writeFile: (p, content) => {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  },
  log: (...a) => console.log(...a),
  error: (...a) => console.error(...a),
};

// Read a JSON filing spec, render a conformant note, and write it under the
// brain's vault/. Returns the process exit code: 0 written, 1 refused/error.
export function runFileBack(argv, deps = realFileBackDeps) {
  let spec;
  try {
    spec = JSON.parse(deps.readInput());
  } catch (err) {
    deps.error(`✗ Invalid JSON spec on stdin: ${err.message}`);
    return 1;
  }

  // A person card that does not say what its identity rests on is REFUSED, not
  // written silently: the builder guarantees form, and a conformant card born of
  // a guess is indistinguishable from one born of a signed source — which is how
  // a surname that exists nowhere became the vault's answer to "who is Jérémy".
  // Required rather than offered: left optional, absence would mean "confirmed".
  if (spec.type === "person" && !spec.confidence) {
    deps.error(
      `✗ vault/ — a person card must say how sure its identity is.\n` +
        `  Add "confidence": { "level": …, "basis": … } to the spec, where level is one of ` +
        `${Object.keys(CONFIDENCE).join(", ")},\n` +
        `  and basis says what the resolution rests on (the source, its date, the card it matched).`,
    );
    return 1;
  }

  let note;
  try {
    note = renderFiledNote({ ...spec, today: deps.today(), universe: deps.universe() });
  } catch (err) {
    deps.error(`✗ ${err.message}`);
    return 1;
  }

  const absPath = toPosix(join(deps.cwd(), "vault", note.path));
  if (deps.exists(absPath)) {
    deps.error(
      `✗ vault/${note.path} already exists — filing back never overwrites. ` +
        `Refine that living page by appending a dated section instead.`,
    );
    return 1;
  }

  // A person filed under a first name the vault already holds must say WHICH
  // one, or the card only moves the ambiguity: the identity discipline's
  // "resolve against the vault" then meets an answer several cards wide.
  if (spec.type === "person" && !spec.distinguish) {
    const homonyms = homonymCards(note.path, deps.peopleCards());
    if (homonyms.length > 0) {
      const firstName = String(spec.title).trim().split(/\s+/)[0];
      const many = homonyms.length > 1;
      deps.error(
        `✗ vault/${note.path} — ${homonyms.length} ${many ? "cards" : "card"} ` +
          `already ${many ? "carry" : "carries"} the first name "${firstName}":\n` +
          homonyms.map((c) => `    ${c}`).join("\n") +
          `\n  A card that does not say WHICH ${firstName} only moves the ambiguity.` +
          `\n  Add "distinguish" to the spec (role, org, and what tells them apart), then re-run.`,
      );
      return 1;
    }
  }

  deps.writeFile(absPath, note.content);
  deps.log(`✓ Filed back: vault/${note.path}`);
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, runFileBack);
