// ─────────────────────────────────────────────────────────────────────────────
// universe-drift.mjs — the pure core of issue #72: a note filed in another sphere
// than the one the pointer names is SAID, once, at the moment it is written.
//
// The measured cost of the silence: ten hours, fourteen notes filed correctly
// under one universe while retrieval served another, and eight meeting
// preparations built on a corpus amputated of its most relevant half. The writes
// were right and the pointer was right; they disagreed without a word.
//
// Why a guard and not the assistant's judgement (ADR 0009 / ADR 0044): filing is
// correct *because* the assistant read the content, and that correctness is
// exactly what hides the divergence — a note in the right folder produces no
// symptom. Critical, repeatable, mechanical → deterministic.
//
// It only ever SPEAKS. Filing a note into another sphere is a legitimate gesture;
// what is never legitimate is doing it without knowing. Auto-switching the pointer
// from one file's location is rejected outright: it would guess intent, and a wrong
// auto-switch moves the scope under the owner, which is worse than a stale pointer.
// ─────────────────────────────────────────────────────────────────────────────
import { noteUniverse } from "./vault-paths.mjs";
import { DEFAULT_UNIVERSE } from "./universes.mjs";

/**
 * The notice for one write — `{ universe, message }` — or `null` when there is
 * nothing to disclose. Pure: the caller owns the pointer, the registry and the
 * memory of what was already said.
 *
 * Silent unless the note's own segment is a REGISTERED universe that differs from
 * the pointer. The default is never registered, so a note at the vault root raises
 * nothing: cross-cutting notes stay in scope whatever the active sphere (ADR 0034),
 * so there is no second scope to name.
 *
 * `alreadySaid` is what this session has already named. Fourteen identical warnings
 * is the noise the issue reported, not a stronger net — but a sphere that has not
 * been named yet is still disclosed, so silence is per sphere and never global.
 */
export function universeDriftNotice({ notePath, pointer, registry = [], alreadySaid = [] }) {
  const filedIn = noteUniverse({ notePath, registry });
  if (filedIn === DEFAULT_UNIVERSE) return null;
  if (filedIn === pointer) return null;
  if (alreadySaid.includes(filedIn)) return null;

  return {
    universe: filedIn,
    message:
      `\n🧭 Heads-up: I filed this note in '${filedIn}' while your active universe is ` +
      `'${pointer}' — my searches keep answering from '${pointer}', so it will not come back ` +
      `until you switch. Say \`/switch ${filedIn}\` if that is where you are working.`,
  };
}
