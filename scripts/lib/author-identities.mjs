// ─────────────────────────────────────────────────────────────────────────────
// author-identities.mjs — the ANSWER to "is that someone else, or you on another
// machine?", written down where it can reach the other machine (plan step 8.3).
//
// WHY IT EXISTS: this brain reads who writes from git author names, and nothing
// else. Two Macs configured `Thomas Pierrain` and `tpierrain` are therefore one
// person that looks exactly like a duo — announced as a second person to somebody
// who is alone, and filed one note per machine. The brain cannot tell; only the
// human can. So it asks, once, and remembers.
//
// WHY IT LIVES IN `.vault-rag/`, beside `universes.json`: a fused identity is a
// fact about the world, true on every machine the owner sits at. Answering once
// has to be answering for both, and `.vault-rag/` is this brain's precedent for
// state that is committed and travels (ADR 0034, issue #69).
//
// THE CONTRACT, and it is the one every session-hook seam signs: fail-open in
// every direction. This file is read at session start, so a missing, half-written,
// hand-edited or merge-mangled one costs the fusion and STRICTLY nothing else —
// every damaged shape degrades to "no registry", which is where this brain came
// from and where it still works.
//
// Pure logic plus an injected fs, exactly like universes.mjs: the edits below
// return a NEW state and never touch the one they were handed, so the caller
// decides whether anything reaches the disk.
// ─────────────────────────────────────────────────────────────────────────────
import { join } from "node:path";

import { slugSafe } from "./filed-note.mjs";

/** Normalised at the source like universes.mjs: fs tolerates either separator, string comparison does not. */
const toPosix = (p) => p.split("\\").join("/");

/** The registry's file name, inside the `.vault-rag` state directory. */
export const AUTHORS_FILE = "authors.json";

/** Where the answers live: `<brain>/.vault-rag/authors.json`, committed and travelling. */
export function authorsPath(dir) {
  return toPosix(join(dir, AUTHORS_FILE));
}

/** The registry of a brain that has never been asked anything. Never shared: every caller may keep it. */
const emptyState = () => ({ identities: [], distinct: [] });

/** The slug of anything at all, or null when it is not a name this brain could file under. */
const nameSlug = (name) => (typeof name === "string" ? slugSafe(name) : null);

/** Every spelling an entry answers to: its canonical name first, then its confirmed aliases. */
const entrySlugs = (entry) =>
  [entry?.name, ...(Array.isArray(entry?.aka) ? entry.aka : [])].map(nameSlug).filter((s) => s !== null);

/**
 * The two lists, as they are on disk.
 *
 * `identities` — `[{ name, aka: [...] }]`, spellings the owner has CONFIRMED are
 * one person. `distinct` — names the owner has confirmed really are somebody else,
 * which is what stops the question being asked again at every session start. A
 * refusal is an answer too, and a design that only remembers "yes" would ask an
 * honest duo the same question forever.
 *
 * Each list is validated on its own, so a file damaged in half keeps its good half.
 */
export function readAuthorsState(io, dir) {
  const path = authorsPath(dir);
  if (!io.existsSync(path)) return emptyState();
  try {
    const parsed = JSON.parse(io.readFileSync(path));
    return {
      identities: Array.isArray(parsed?.identities) ? parsed.identities : [],
      distinct: Array.isArray(parsed?.distinct) ? parsed.distinct.filter((n) => typeof n === "string") : [],
    };
  } catch {
    return emptyState();
  }
}

/**
 * Persists the two lists, creating the state directory. Written indented because a
 * human opens this file: it holds their own answer about their own name, and a
 * registry nobody can read by hand is one nobody can correct by hand.
 */
export function writeAuthorsState(io, dir, state) {
  io.mkdirSync(dir, { recursive: true });
  const body = { identities: state.identities, distinct: state.distinct };
  io.writeFileSync(authorsPath(dir), `${JSON.stringify(body, null, 2)}\n`);
}

/** Has the owner confirmed this name is genuinely somebody else? Compared by slug, like every other name here. */
export function isAcknowledged(state, name) {
  const slug = nameSlug(name);
  if (slug === null || !Array.isArray(state?.distinct)) return false;
  return state.distinct.some((known) => nameSlug(known) === slug);
}

/**
 * Records *"that spelling is me on my other machine"*.
 *
 * CONVERGENT ON PURPOSE: the other machine asks the same question with the two
 * names the other way round, so the answer is merged into whichever entry already
 * knows either spelling. Two entries for one person would be a registry that
 * disagrees with itself, and it would be produced by the ordinary case of
 * answering wherever you happen to be sitting.
 *
 * @returns `{ ok, reason?, state, changed, canonical }` — `state` is the input
 * itself when nothing is written, so a caller may always persist what it gets back.
 */
export function fuseAuthors(state, canonical, alias) {
  const canonicalSlug = nameSlug(canonical);
  const aliasSlug = nameSlug(alias);
  // A name with no slug cannot be spelled into a filename, so fusing INTO it would
  // trade a usable name for an unusable one — worse than not fusing at all.
  if (canonicalSlug === null || aliasSlug === null) {
    return { ok: false, reason: "unusable", state, changed: false, canonical: null };
  }

  const identities = Array.isArray(state?.identities) ? state.identities : [];
  const found = identities.findIndex((entry) => {
    const slugs = entrySlugs(entry);
    return slugs.includes(canonicalSlug) || slugs.includes(aliasSlug);
  });

  if (found === -1) {
    // Nobody knows either spelling yet: the person enters the registry under the
    // name the caller kept, which is the one this brain will file them under.
    const aka = aliasSlug === canonicalSlug ? [] : [alias];
    return {
      ok: true,
      state: { ...state, identities: [...identities, { name: canonical, aka }], distinct: state.distinct ?? [] },
      changed: true,
      canonical,
    };
  }

  const entry = identities[found];
  const kept = typeof entry.name === "string" ? entry.name : canonical;
  const known = new Set(entrySlugs(entry));
  // Whichever of the two spellings this entry had not met yet joins it. The kept
  // name never moves: a brain that renamed the person at every answer would file
  // the same human under a different file each time somebody replied.
  const additions = [canonical, alias].filter((name) => {
    const slug = nameSlug(name);
    if (slug === null || known.has(slug)) return false;
    known.add(slug);
    return true;
  });
  if (additions.length === 0) return { ok: true, state, changed: false, canonical: kept };

  const merged = { ...entry, name: kept, aka: [...(Array.isArray(entry.aka) ? entry.aka : []), ...additions] };
  return {
    ok: true,
    state: { ...state, identities: identities.map((e, i) => (i === found ? merged : e)) },
    changed: true,
    canonical: kept,
  };
}

/**
 * Records *"no, that really is somebody else"* — which is what makes the question
 * stop being asked, and is therefore just as load-bearing as a fusion.
 *
 * It also UNDOES a wrong fusion: a human who answered "it's me" about a colleague
 * must be able to say so, and the correction has to reach the filing rule, not just
 * the question. The alias is dropped from whoever had swallowed it; an entry the
 * name is the CANONICAL of is left alone — that entry is that person's own identity,
 * and confirming they exist is no reason to dismantle it.
 */
export function markDistinct(state, name) {
  const slug = nameSlug(name);
  if (slug === null) return { ok: false, reason: "unusable", state, changed: false };

  const identities = Array.isArray(state?.identities) ? state.identities : [];
  const unfused = identities.map((entry) => {
    const aka = Array.isArray(entry?.aka) ? entry.aka : [];
    const kept = aka.filter((alias) => nameSlug(alias) !== slug);
    return kept.length === aka.length ? entry : { ...entry, aka: kept };
  });
  const fusionUndone = unfused.some((entry, i) => entry !== identities[i]);

  const distinct = Array.isArray(state?.distinct) ? state.distinct : [];
  const already = distinct.some((known) => nameSlug(known) === slug);
  if (already && !fusionUndone) return { ok: true, state, changed: false };

  return {
    ok: true,
    state: { identities: unfused, distinct: already ? distinct : [...distinct, name] },
    changed: true,
  };
}
