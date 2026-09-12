// ─────────────────────────────────────────────────────────────────────────────
// vault-write-notice.mjs — the pure core of the PreToolUse(Write|Edit) sibling of
// `vault-write-guard.mjs`: the one hook that carries BOTH write-time disclosures
// of v5.3, because both ask the same question of the same event — *what does this
// write say about the sphere it lands in?*
//
//   • #72, the universe drift: this note is being filed somewhere the pointer does
//     not name, so searches will not bring it back. It REPORTS, never acts:
//     auto-switching would guess intent from one file.
//   • #66, the declared spelling: a name the owner already resolved is coming back
//     wrong. It CORRECTS, without asking (ADR 0043's announce-then-act tier), and
//     says so afterwards — because the case this exists for is a brain sent off to
//     prepare eight meetings, where a question waiting for an answer is a halt, and
//     a halt is worse than a misspelling.
//
// 🔀 The two sit at DIFFERENT tiers deliberately: a typo with a declared right
// answer is not an intent question.
//
// ⚠️ IT NEVER REFUSES. `guardDecision`'s refusal stays in `vault-write-guard.mjs`
// alone: one hook refuses unindexable notes, this one only ever speaks. Mixing a
// refusal and an advisory in one verdict is how a warning eventually starts blocking.
//
// 📐 WHY THE CORRECTION IS MADE HERE AND NOT AFTER THE WRITE (measured 2026-09-12,
// ADR 0044): hooks on one event run CONCURRENTLY, so a PostToolUse corrector could
// not guarantee that `auto-commit` commits corrected bytes. Rewriting the tool INPUT
// means the file is written once, and there is no race left to manage. The host
// applies `updatedInput` without any permission decision being claimed — and it must
// stay that way: correcting must never GRANT a write the owner's own rules would stop.
// ─────────────────────────────────────────────────────────────────────────────
import { applyDeclaredSpellings, declaredSpellings } from "./declared-spellings.mjs";
import { noteUniverse, vaultNotePath } from "./vault-paths.mjs";
import { universeDriftNotice } from "./universe-drift.mjs";

/** How a correction is keyed, in the trace and in what was already said. */
export const correctionKey = ({ from, to }) => `${from}→${to}`;

/**
 * The budget for one payload — volume IS the defect (F5). This directive rides a
 * channel the owner can read, on the most-walked path there is (every write), so
 * what gets cut when it overflows is the LIST of spellings, never the instruction:
 * the instruction is the only part that changes what Claude does.
 */
export const NOTICE_MAX = 560;

/** How many spellings are named before the rest become a count. */
const NAMED_AT_MOST = 3;

/**
 * Everything this hook has to say about one tool call:
 *
 *   • `updatedInput` — the tool input with the declared spellings corrected, or
 *     `null` when nothing was rewritten (and then the host applies the original).
 *   • `context` — the directive for CLAUDE, or `null` when there is nothing new to
 *     say. It addresses Claude and never the human: the sentence the owner reads is
 *     Claude's own, in the owner's language, in the flow of the answer.
 *   • `said` — what this call would add to the session's memory, so the next write
 *     stays quiet about the same sphere and the same correction.
 *   • `bypassUsed` — an undo went through untouched (see `bypass` below).
 *
 * Pure: the caller owns the pointer, the registry, the profiles and the session's
 * memory. Fail-open throughout — a profile that cannot be read costs the correction,
 * never the write.
 *
 * `bypass` is the one-shot list that makes an undo possible. Without it the owner
 * says *"no, put Cortex back"*, the brain writes it, this guard replaces it again,
 * and the owner's word loses to a hook — the exact inversion the 🟡 tier forbids.
 */
export function writeNotice({
  toolName,
  toolInput,
  brainDir,
  registry = [],
  pointer,
  readProfile,
  // `{}` rather than a shaped default: the two reads below already fall back key by
  // key, so a shaped default would be a second spelling of the same fallback — and
  // the mutation pass proved no input can tell the two apart.
  said = {},
  bypass = [],
}) {
  const nothing = { updatedInput: null, context: null, said: { universes: [], corrections: [] }, bypassUsed: false };

  const notePath = vaultNotePath({ toolName, filePath: toolInput?.file_path, brainDir });
  if (notePath === null) return nothing;

  const drift = universeDriftNotice({ notePath, pointer, registry, alreadySaid: said.universes ?? [] });
  const spelling = correctSpellings({ toolName, toolInput, notePath, registry, readProfile, bypass });

  const fresh = spelling.corrections.filter((one) => !(said.corrections ?? []).includes(correctionKey(one)));

  return {
    updatedInput: spelling.updatedInput,
    context: boundedContext([
      drift?.message ?? null,
      correctionDirective(fresh),
      protectedDirective(spelling.protectedHits),
    ]),
    said: {
      universes: drift ? [drift.universe] : [],
      corrections: fresh.map(correctionKey),
    },
    bypassUsed: spelling.bypassUsed,
  };
}

// The text this call would put INTO the note, and the key it lives under. An Edit's
// anchor is deliberately not a candidate: correcting `old_string` would look for a
// passage that is not on disk, and the edit would fail — a guard that breaks the very
// write it was watching.
const WRITTEN_TEXT = { Write: "content", Edit: "new_string" };

function correctSpellings({ toolName, toolInput, notePath, registry, readProfile, bypass }) {
  const quiet = { updatedInput: null, corrections: [], protectedHits: [], bypassUsed: false };
  const field = WRITTEN_TEXT[toolName];
  // No `?.` here: this runs only past `notePath !== null`, which required a
  // `file_path` off this very object, so it is an object by the time we arrive.
  const written = toolInput[field];
  if (typeof written !== "string") return quiet;

  const declared = declaredFor(notePath, registry, readProfile);
  // Answered BEFORE the bypass is subtracted, and from the declared list rather than
  // from the silence that follows: an undo usually spares the only spelling there was,
  // and "nothing was corrected" then looks exactly like "an undo went through" — only
  // one of which is worth spending the one shot on.
  const bypassUsed = bypassHit(written, declared, bypass);

  // No early return on an empty list: `applyDeclaredSpellings` already answers an
  // empty rule set with the text untouched, so a guard clause here would be a second
  // place deciding the same thing — and the mutation pass proved no input can see it.
  const entries = withoutBypassed(declared, bypass);
  const { text, corrections, protectedHits } = applyDeclaredSpellings(written, entries);
  return {
    updatedInput: corrections.length ? { ...toolInput, [field]: text } : null,
    corrections,
    protectedHits,
    bypassUsed,
  };
}

// The spellings declared by the sphere the NOTE is filed in — not the pointer's. A
// fact is "always true HERE", and here is where the note lands. The default universe
// is the other path through the profile's own location (its profile sits at the vault
// root, with no `universe:` key), which is why both are exercised.
function declaredFor(notePath, registry, readProfile) {
  try {
    return declaredSpellings(readProfile(noteUniverse({ notePath, registry })));
  } catch {
    return [];
  }
}

function withoutBypassed(entries, bypass) {
  const spared = new Set(bypass.map((one) => one.toLowerCase()));
  // An entry left with no spellings is dropped downstream anyway (a rule needs a
  // `from`), so it is not filtered out here: one place decides what a usable rule is.
  return entries.map((entry) => ({
    ...entry,
    wrong: entry.wrong.filter((one) => !spared.has(one.toLowerCase())),
  }));
}

// A bypass only counts when it spares a spelling this sphere actually DECLARES and
// the text actually carries: a stale list naming something nobody declared must not
// consume itself against an unrelated write.
function bypassHit(written, declared, bypass) {
  const spared = new Set(bypass.map((one) => one.toLowerCase()));
  const haystack = written.toLowerCase();
  return declared.some((entry) =>
    entry.wrong.some((one) => spared.has(one.toLowerCase()) && haystack.includes(one.toLowerCase())),
  );
}

// The payload, under budget — volume IS the defect (F5). The lines arrive most
// important first, so the last one goes first, and what survives to the end is cut
// mid-sentence rather than allowed to run: a directive nobody finishes reading is
// the same defect as no directive at all.
function boundedContext(lines) {
  const kept = lines.filter(Boolean);
  while (kept.length > 1 && kept.join("\n").length > NOTICE_MAX) kept.pop();
  const text = kept.join("\n");
  if (text.length === 0) return null;
  return text.length <= NOTICE_MAX ? text : `${text.slice(0, NOTICE_MAX - 1)}…`;
}

// The directive, addressed to Claude. Batched by construction: it is only emitted for
// a correction this session has not announced yet, so eight meeting preparations
// produce one closing sentence rather than eight interruptions.
function correctionDirective(corrections) {
  if (corrections.length === 0) return null;
  const pairs = namedThenCounted(corrections.map(({ from, to }) => `'${from}' → '${to}'`));
  return (
    `\n✍️ I corrected the spelling here, from this universe's declared rule: ${pairs}. ` +
    `Say so once when you hand back, in the owner's own language and your own words, and ` +
    `offer to undo it.`
  );
}

// Past three, a list has stopped being a list and become a roll-call: the rest are
// counted, and the count of what is NOT named is what tells Claude to go and look.
function namedThenCounted(items) {
  if (items.length <= NAMED_AT_MOST) return items.join(", ");
  const named = items.slice(0, NAMED_AT_MOST);
  return `${named.join(", ")} and ${items.length - named.length} more`;
}

// The one passage the guard will not touch is otherwise the one nobody hears about.
function protectedDirective(protectedHits) {
  if (protectedHits.length === 0) return null;
  const names = namedThenCounted(protectedHits.map(({ from }) => `'${from}'`));
  return (
    `\n👀 I left ${names} as written: quoted material, code or a link, where rewriting ` +
    `falsifies a record. Mention it once if it matters.`
  );
}
