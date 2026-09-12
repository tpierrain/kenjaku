// ─────────────────────────────────────────────────────────────────────────────
// vault-paths.mjs — the shared vault-path codec (v5.3, § M2). One question, one
// place: *given a tool call, which vault note does it touch, and which universe
// is that note filed under?*
//
// Built here, and not earlier as a speculative refactor, because a second
// consumer finally justified it: `vault-write-guard.mjs` derived the path to
// decide whether a note may be BORN, and the universe-drift notice needs the very
// same derivation to decide whether the note lands in the sphere the pointer names.
// Two spellings of one question are two behaviours to keep in step for ever.
// ─────────────────────────────────────────────────────────────────────────────
import { relative, sep } from "node:path";

import { DEFAULT_UNIVERSE } from "./universes.mjs";

/**
 * The vault-relative path of a note this tool call would write, or `null` when the
 * call is none of our business (another tool, a file outside `vault/`, a non-note).
 * Only indexed files are covered: everything else is the owner's to write freely.
 */
export function vaultNotePath({ toolName, filePath, brainDir }) {
  if (toolName !== "Write" && toolName !== "Edit") return null;
  if (typeof filePath !== "string" || !filePath.toLowerCase().endsWith(".md")) return null;
  const rel = relative(brainDir, filePath).split(sep).join("/");
  return rel.startsWith("vault/") ? rel : null;
}

/**
 * The universe a vault note is FILED under, read from its path alone: the first
 * segment below `vault/` when that segment is a registered universe, the default
 * otherwise. Pure.
 *
 * The default is what an ABSENT prefix means (ADR 0034) — there is no
 * `vault/default/` — so a note at the root and a note under some folder nobody
 * registered answer the same thing. That is deliberate: an unregistered directory
 * is a folder someone made, not a sphere, and promoting it would make every stray
 * directory look like a universe.
 */
export function noteUniverse({ notePath, registry = [] }) {
  const segment = typeof notePath === "string" ? notePath.split("/")[1] : undefined;
  // No `segment !== undefined` guard: a registry never holds `undefined`, so the
  // membership test already answers that case. The mutation pass proved the guard
  // unobservable, and two spellings of one question is how they drift apart.
  return registry.includes(segment) ? segment : DEFAULT_UNIVERSE;
}
