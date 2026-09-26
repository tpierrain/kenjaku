// ─────────────────────────────────────────────────────────────────────────────
// sync-report.mjs — what `/sync` tells the owner, written by the machine (#131).
//
// The skill used to leave the report to the model, and on 2026-09-26 that report
// said "your other machine pushed nothing since last time" about a machine that had
// pushed all day: the live sync had already pulled its work the evening before, so
// the rebase had nothing left to do. "Nothing came in during this /sync" and "the
// other side pushed nothing" are the same output of `git rebase`; only the RECORD of
// earlier arrivals tells them apart, and the model consulted none. Then it wrote a
// weekday by hand, and got it wrong.
//
// So three facts, each from a record and never from a sentence:
//   • what THIS /sync brought (the rebase's own diff);
//   • the last ARRIVAL on this machine, from `remote-arrivals.json` — read whether or
//     not it was already announced: announce-once is right for the unprompted
//     directive and wrong for /sync, an explicit question often asked from a
//     session that never heard the answer;
//   • the last push the REMOTE received, with its committer, so a second machine
//     committing under another email reads as "your other machine".
// Every date and weekday is `Intl`'s, in the owner's time zone. The skill relays the
// text VERBATIM. The fr strings are a deliberate PRODUCT localization.
//
// Pure: the facts come in, the text goes out. The git and disk reads live in
// scripts/sync-report.mjs.
// ─────────────────────────────────────────────────────────────────────────────
import { isSamePerson } from "./brain-author.mjs";
import { isNote } from "./remote-arrivals.mjs";

const WORDS = {
  fr: {
    when: ({ weekday, day, month, hour, minute }) => `${weekday} ${day}/${month} à ${hour}h${minute}`,
    files: (n) => `${n} fichier${n > 1 ? "s" : ""}`,
    ofWhichNotes: (n) => ` (dont ${n} note${n > 1 ? "s" : ""})`,
    and: "et",
    fromOtherMachine: "de ton autre machine",
    from: (names) => `de ${names}`,
    pulledNow: (what) => `📥 Ce /sync a récupéré ${what}.`,
    alreadyHere: (when, { what, from }) => `✅ Rien de nouveau depuis ${when}, heure à laquelle la synchro automatique a déjà rapatrié ici ${what}${from}.`,
    upToDate: "✅ Rien de nouveau : cette machine a déjà tout ce que le dépôt distant contient.",
    previousArrival: (when, { what, from }) => `🕘 Arrivée précédente sur cette machine : ${when}, par la synchro automatique : ${what}${from}.`,
    remote: (rest) => `📤 Dernier push reçu par le dépôt distant : ${rest}.`,
    remoteUnknown: "inconnu (la branche distante n'a pas pu être lue)",
    byOtherMachine: (email) => `depuis ton autre machine (${email})`,
    bySameIdentity: "avec la même identité git que cette machine",
    bySomeone: (name, email) => `par ${name} (${email})`,
    thisSync: (committed, pushed) =>
      `Ce /sync : commit local ${committed ? "oui" : "non"} · push ${pushed === "ok" ? "envoyé" : "en échec"}.`,
  },
  en: {
    when: ({ weekday, day, monthShort, hour, minute }) => `${weekday} ${day} ${monthShort} at ${hour}:${minute}`,
    files: (n) => `${n} file${n > 1 ? "s" : ""}`,
    ofWhichNotes: (n) => ` (${n} of them note${n > 1 ? "s" : ""})`,
    and: "and",
    fromOtherMachine: "from your other machine",
    from: (names) => `from ${names}`,
    pulledNow: (what) => `📥 This /sync brought ${what}.`,
    alreadyHere: (when, { what, from }) => `✅ Nothing new since ${when}, when the automatic sync had already brought ${what} here${from}.`,
    upToDate: "✅ Nothing new: this machine already has everything the remote holds.",
    previousArrival: (when, { what, from }) => `🕘 Previous arrival on this machine: ${when}, by the automatic sync: ${what}${from}.`,
    remote: (rest) => `📤 Last push the remote received: ${rest}.`,
    remoteUnknown: "unknown (the remote branch could not be read)",
    byOtherMachine: (email) => `from your other machine (${email})`,
    bySameIdentity: "under the same git identity as this machine",
    bySomeone: (name, email) => `by ${name} (${email})`,
    thisSync: (committed, pushed) =>
      `This /sync: local commit ${committed ? "yes" : "no"} · push ${pushed === "ok" ? "sent" : "failed"}.`,
  },
};

const wordsFor = (locale) => WORDS[locale] ?? WORDS.en;

/** A moment, as the owner says it: weekday and all, computed by the calendar in their time zone. */
export function formatWhen(iso, locale, timeZone) {
  const words = wordsFor(locale);
  const tag = WORDS[locale] ? locale : "en";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat(tag, {
      timeZone,
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map(({ type, value }) => [type, value]),
  );
  const monthShort = new Intl.DateTimeFormat(tag, { timeZone, month: "short" }).format(new Date(iso));
  return words.when({ ...parts, monthShort });
}

// Never called with an empty list: `fromWhom` answers "" before it gets here.
function joinNames(names, words) {
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} ${words.and} ${names.at(-1)}`;
}

/** How many files: "17 fichiers (dont 16 notes)". */
function howMany(files, words) {
  const notes = files.filter(isNote).length;
  return `${words.files(files.length)}${notes > 0 ? words.ofWhichNotes(notes) : ""}`;
}

/** From whom, as a clause to append: " de ton autre machine", " de Claire", or "" when nobody is on record. */
function fromWhom(authors, { me, identities }, words) {
  if (authors.length === 0) return "";
  const allMe = authors.every((a) => isSamePerson(a, me.name, identities));
  return ` ${allMe ? words.fromOtherMachine : words.from(joinNames(authors, words))}`;
}

function remoteLine(remoteHead, { me, identities, locale, timeZone }, words) {
  if (!remoteHead) return words.remote(words.remoteUnknown);
  const who =
    remoteHead.email === me.email
      ? words.bySameIdentity
      : isSamePerson(remoteHead.name, me.name, identities)
        ? words.byOtherMachine(remoteHead.email)
        : words.bySomeone(remoteHead.name, remoteHead.email);
  return words.remote(`${formatWhen(remoteHead.at, locale, timeZone)}, ${who}`);
}

/**
 * The whole report, one fact per line, in the owner's language.
 * @param {{ locale: string, timeZone: string, trace: object|null, remoteHead: {at,name,email}|null,
 *   me: {name,email}, identities: object[], thisSync: { committed: boolean, pulled: string[], pushed: "ok"|"failed" } }} facts
 */
export function syncReport({ locale, timeZone, trace, remoteHead, me, identities, thisSync }) {
  const words = wordsFor(locale);
  const who = { me, identities };
  const arrival = trace?.arrivedAt
    ? { when: formatWhen(trace.arrivedAt, locale, timeZone), what: howMany(trace.files, words), from: fromWhom(trace.authors, who, words) }
    : null;

  const lines = [];
  if (thisSync.pulled.length > 0) {
    lines.push(words.pulledNow(howMany(thisSync.pulled, words)));
    if (arrival) lines.push(words.previousArrival(arrival.when, arrival));
  } else {
    lines.push(arrival ? words.alreadyHere(arrival.when, arrival) : words.upToDate);
  }
  lines.push(remoteLine(remoteHead, { me, identities, locale, timeZone }, words));
  lines.push(words.thisSync(thisSync.committed, thisSync.pushed));
  return lines.join("\n");
}
