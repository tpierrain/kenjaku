import { test } from "node:test";
import assert from "node:assert/strict";

import { universeDriftNotice } from "./universe-drift.mjs";
import { DEFAULT_UNIVERSE } from "./universes.mjs";

const REGISTRY = ["acme", "globex"];

test("a note filed under another sphere than the pointer is disclosed", () => {
  const notice = universeDriftNotice({
    notePath: "vault/acme/people/marie.md",
    pointer: "globex",
    registry: REGISTRY,
  });
  assert.equal(notice?.universe, "acme");
  assert.match(notice.message, /'acme'/);
  assert.match(notice.message, /'globex'/);
});

test("the sentence names BOTH scopes — where the note lands, and what searches answer from", () => {
  // The whole value of these disclosures is naming WHICH sphere (ADR 0044): a generic
  // "scopes may differ" names nothing and so cannot be acted on.
  const { message } = universeDriftNotice({
    notePath: "vault/acme/note.md",
    pointer: "globex",
    registry: REGISTRY,
  });
  assert.equal(
    message,
    "\n🧭 Heads-up: I filed this note in 'acme' while your active universe is 'globex' — " +
      "my searches keep answering from 'globex', so it will not come back until you switch. " +
      "Say `/switch acme` if that is where you are working.",
  );
});

test("it says nothing when the note lands in the sphere the pointer names", () => {
  assert.equal(
    universeDriftNotice({ notePath: "vault/acme/note.md", pointer: "acme", registry: REGISTRY }),
    null,
  );
});

test("it discloses a named sphere even when the pointer is the cross-cutting one", () => {
  // The measured failure ran this way round: ten hours of notes filed correctly under
  // one universe while retrieval served another.
  const notice = universeDriftNotice({
    notePath: "vault/globex/meeting.md",
    pointer: DEFAULT_UNIVERSE,
    registry: REGISTRY,
  });
  assert.equal(notice?.universe, "globex");
});

test("a note at the vault root says nothing, whatever the pointer", () => {
  // The root IS the default universe and the default is never registered, so there is
  // no second sphere to name — and cross-cutting notes stay in scope anyway (ADR 0034).
  assert.equal(
    universeDriftNotice({ notePath: "vault/note.md", pointer: "acme", registry: REGISTRY }),
    null,
  );
});

test("an unregistered folder is not a universe, so it raises nothing", () => {
  // Otherwise every stray directory someone made becomes a warning, and noise is how
  // a net stops being read.
  assert.equal(
    universeDriftNotice({ notePath: "vault/inbox/note.md", pointer: "acme", registry: REGISTRY }),
    null,
  );
});

test("it stays silent on a sphere it has already named this session", () => {
  // Fourteen identical warnings is the noise the issue reported, not a stronger net.
  assert.equal(
    universeDriftNotice({
      notePath: "vault/acme/second-note.md",
      pointer: "globex",
      registry: REGISTRY,
      alreadySaid: ["acme"],
    }),
    null,
  );
});

test("having spoken about ONE sphere does not silence a different one", () => {
  const notice = universeDriftNotice({
    notePath: "vault/globex/note.md",
    pointer: "acme",
    registry: REGISTRY,
    alreadySaid: ["acme", "zenith"],
  });
  assert.equal(notice?.universe, "globex");
});

test("it has nothing to say about a call the codec refused", () => {
  assert.equal(
    universeDriftNotice({ notePath: null, pointer: "acme", registry: REGISTRY }),
    null,
  );
});

test("a brain with no universes at all never sees this notice", () => {
  assert.equal(
    universeDriftNotice({ notePath: "vault/acme/note.md", pointer: "acme", registry: [] }),
    null,
  );
});

test("the notice carries no verdict: this half only ever speaks", () => {
  // The refusal stays in vault-write-guard alone (§ Step 4). Mixing a refusal and an
  // advisory in one verdict is how a warning eventually starts blocking.
  const notice = universeDriftNotice({
    notePath: "vault/acme/note.md",
    pointer: "globex",
    registry: REGISTRY,
  });
  assert.deepEqual(Object.keys(notice).sort(), ["message", "universe"]);
});
