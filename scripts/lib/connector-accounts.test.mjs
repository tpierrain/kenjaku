import test from "node:test";
import assert from "node:assert/strict";

import {
  checkSlackAccount,
  compareConnectorAccount,
  declaredAccountFor,
  renderConnectorAccounts,
} from "./connector-accounts.mjs";

// The defect this file exists for: a universe profile DECLARES `Slack:
// acme.slack.com`, the connector is still authenticated on the sphere the owner
// just left, and the brain fetches one organisation's data while displaying the
// other's name. The declaration is a claim; only an observation settles it.

test("a workspace that is not the declared one is a DIVERGENCE, and the line names both", () => {
  const verdict = compareConnectorAccount({
    tool: "Slack",
    declared: "acme",
    observed: "globex",
  });

  assert.deepEqual(verdict, {
    status: "diverging",
    line:
      "Slack is on 'globex' — this universe declares 'acme'. " +
      "Do not read or file Slack data here until the connector is reconnected to 'acme'.",
  });
});

test("the workspace the universe declares is a MATCH, and the line says it was observed", () => {
  const verdict = compareConnectorAccount({
    tool: "Slack",
    declared: "acme",
    observed: "acme",
  });

  assert.deepEqual(verdict, {
    status: "matching",
    line: "Slack is on 'acme', which is what this universe declares (observed, not assumed).",
  });
});

// The two sides are typed by different hands: the DECLARATION is what the owner
// answered at `/switch` ("acme.slack.com" is how a person names a workspace), the
// OBSERVATION is whatever a Slack result happened to carry. Normalised separately,
// so each side is proved on its own (a shared fixture would let one side's bug
// hide behind the other's).

test("the TOOL name is read the way a hand-edited note writes it, spaces and capitals and all", () => {
  // The profile is a page its owner edits in Obsidian, so `- Slack : acme` with a
  // stray space is a shape that exists. Read strictly, Slack would fall through to
  // "nothing asks Slack which account it is on" — the one connector that CAN answer,
  // silently demoted to the unverifiable tier by a space.
  const verdict = compareConnectorAccount({
    tool: " SLACK ",
    declared: "acme",
    observed: "globex",
  });

  assert.equal(verdict.status, "diverging");
});

test("padding and capitals are not a divergence — a checker that cries wolf gets ignored", () => {
  // CONVENTIONS.md §5quater: a checker is judged on what it says about a HEALTHY
  // brain. Sending someone to reconnect a perfectly good connector because they
  // pasted ` ACME.slack.com ` is how this check would teach its owner to skip it.
  const verdict = compareConnectorAccount({
    tool: "Slack",
    declared: "acme",
    observed: "  ACME.slack.com  ",
  });

  assert.deepEqual(verdict, {
    status: "matching",
    line: "Slack is on 'acme', which is what this universe declares (observed, not assumed).",
  });
});

test("Slack with NOTHING observed is 'could not find out', never a match and never a divergence", () => {
  // The tool is verifiable here, so the absent observation is the sole cause.
  // Rendering this as a divergence would send the owner to reconnect a connector
  // that may be perfectly fine; rendering it as a match is the original defect.
  const verdict = compareConnectorAccount({ tool: "Slack", declared: "acme" });

  assert.deepEqual(verdict, {
    status: "unverified",
    line:
      "Slack: this universe declares 'acme' — I could not find out which workspace " +
      "the connector is actually on. Treat it as a claim.",
  });
});

test("a connector nobody can interrogate stays UNVERIFIED, even when the strings agree", () => {
  // Deliberately fed a matching observation: the tool is then the ONLY reason
  // this is not a match. Every other connector exposes identity differently
  // (Miro has a `who am I`, Notion partially, Drive not really), and rendering
  // "not verifiable" as "verified" is the exact conflation this release is about.
  const verdict = compareConnectorAccount({
    tool: "Notion",
    declared: "Acme workspace",
    observed: "Acme workspace",
  });

  assert.deepEqual(verdict, {
    status: "unverified",
    line:
      "Notion: this universe declares 'Acme workspace' — declared, never verified " +
      "(nothing asks Notion which account it is on). Treat it as a claim.",
  });
});

test("an observation taken from a permalink matches a bare declaration", () => {
  // The cheapest thing a Slack result carries is a permalink, so this IS the
  // shape the check will be fed in the field.
  const verdict = compareConnectorAccount({
    tool: "Slack",
    declared: "acme",
    observed: "https://acme.slack.com/archives/C0123/p1712345678",
  });

  assert.deepEqual(verdict, {
    status: "matching",
    line: "Slack is on 'acme', which is what this universe declares (observed, not assumed).",
  });
});

test("a declaration written as a full domain matches a bare workspace slug", () => {
  const verdict = compareConnectorAccount({
    tool: "Slack",
    declared: "acme.slack.com",
    observed: "acme",
  });

  assert.deepEqual(verdict, {
    status: "matching",
    line: "Slack is on 'acme', which is what this universe declares (observed, not assumed).",
  });
});

// --- what the digest is allowed to say ---------------------------------------
// The digest is `[working context]`: background the agent uses SILENTLY, printed
// right after a `/switch`. That is precisely the moment the connectors have not
// followed, so this is where a declaration must stop wearing the clothes of a fact.

test("a declared Slack account is rendered as a claim, with the gesture that settles it", () => {
  const lines = renderConnectorAccounts(["Slack: acme.slack.com"]);

  assert.deepEqual(lines, [
    "Connector accounts, as DECLARED on this page (a claim, never verified): Slack: acme.slack.com.",
    "Slack can be checked, and here it must be: before reading or filing anything from Slack " +
      "in this universe, observe the workspace a Slack result names, then run " +
      '`node scripts/set-universe-profile.mjs --check-slack "<workspace>"`.',
  ]);
});

test("a universe that declares no Slack gets no Slack gesture", () => {
  // Two entries, unsorted, one of them a decoy: the gesture must key on WHICH
  // tools are declared, not on the section being non-empty.
  const lines = renderConnectorAccounts(["Notion: Acme workspace", "Drive: acme.com"]);

  assert.deepEqual(lines, [
    "Connector accounts, as DECLARED on this page (a claim, never verified): " +
      "Notion: Acme workspace, Drive: acme.com.",
  ]);
});

test("a universe that declares nothing says nothing", () => {
  // Most profiles have no `## Connector accounts` section at all. A block
  // announcing an empty claim would put plumbing in every switch, for nothing.
  assert.deepEqual(renderConnectorAccounts([]), []);
});

test("Slack among OTHER connectors still gets its gesture — one checkable tool is enough", () => {
  // The realistic page declares several tools and only one of them can answer.
  // Keyed on "all of them are checkable", the gesture would vanish the day an
  // owner adds a Notion line under their Slack one — the check silently lost to
  // an edit that has nothing to do with it.
  const lines = renderConnectorAccounts(["Notion: Acme workspace", "Slack: acme.slack.com"]);

  assert.deepEqual(lines, [
    "Connector accounts, as DECLARED on this page (a claim, never verified): " +
      "Notion: Acme workspace, Slack: acme.slack.com.",
    "Slack can be checked, and here it must be: before reading or filing anything from Slack " +
      "in this universe, observe the workspace a Slack result names, then run " +
      '`node scripts/set-universe-profile.mjs --check-slack "<workspace>"`.',
  ]);
});

// --- reading the declaration off a hand-edited page ---------------------------
// The profile is a note its owner edits in Obsidian, so every bullet below is a
// shape that exists in the field. Read strictly, each one silently demotes the one
// connector that CAN be verified into "declared, never verified".

test("declaredAccountFor picks the asked-for tool out of a list, not simply the first bullet", () => {
  const entries = ["Notion: Acme workspace", "Slack: acme.slack.com", "Drive: acme.com"];

  assert.equal(declaredAccountFor(entries, "Slack"), "acme.slack.com");
  assert.equal(declaredAccountFor(entries, "Notion"), "Acme workspace");
  assert.equal(declaredAccountFor(entries, "Miro"), null); // not declared at all
});

test("declaredAccountFor reads through the spaces and capitals a person types", () => {
  // `- Slack : acme.slack.com ` — a space before the colon, padding after it, and
  // the tool asked for in another case than it was written in.
  assert.equal(declaredAccountFor(["Slack : acme.slack.com "], " sLaCk "), "acme.slack.com");
});

// --- checkSlackAccount: the whole verdict, including the two undeclared shapes --

test("a universe with NO profile page at all is undeclared, and points at the door that fixes it", () => {
  // Every brain installed before profiles existed is in this state. It is not a
  // mismatch (there is no claim to contradict) and not a match either.
  const verdict = checkSlackAccount({
    entries: null,
    observed: "https://acme.slack.com/archives/C0123",
    profilePath: "vault/acme/universe.md",
  });

  assert.deepEqual(verdict, {
    status: "undeclared",
    line:
      "This universe has no profile page yet, so it declares no accounts to check against. " +
      "Slack is on 'acme'. `/switch` can describe this sphere, accounts included.",
  });
});

test("no page AND nothing observed still answers, with an empty workspace rather than a fake one", () => {
  // Both unknowns at once is the state of a brain that has neither a profile nor a
  // reachable Slack. The sentence must not invent a workspace name to fill the hole.
  const verdict = checkSlackAccount({ entries: null, profilePath: "vault/acme/universe.md" });

  assert.deepEqual(verdict, {
    status: "undeclared",
    line:
      "This universe has no profile page yet, so it declares no accounts to check against. " +
      "Slack is on ''. `/switch` can describe this sphere, accounts included.",
  });
});

test("a page that declares no Slack offers the declaration, quoting the workspace it just saw", () => {
  // Nothing declared is not a divergence: there is no claim to contradict. It is
  // the one moment where the right answer is an offer, since the workspace is right
  // there — and the offer names the file and the exact line to add.
  const verdict = checkSlackAccount({
    entries: ["Notion: Acme workspace"],
    observed: "  ACME.slack.com  ",
    profilePath: "vault/acme/universe.md",
  });

  assert.deepEqual(verdict, {
    status: "undeclared",
    line:
      "This universe declares no Slack account, so there is nothing to check against. " +
      "Slack is on 'acme'; if that is the right workspace here, add " +
      "`- Slack: acme` under `## Connector accounts` in vault/acme/universe.md.",
  });
});

test("nothing declared AND nothing observed offers nothing — an empty bullet is not a suggestion", () => {
  // Both halves unknown at once: a Notion-only profile, and a Slack that did not
  // answer. The offer branch would then hand the owner `- Slack: ` to paste into
  // their page — a declaration of nothing, which is exactly the kind of claim this
  // whole check exists to stop. So the two unknowns are said, and nothing is offered.
  const verdict = checkSlackAccount({
    entries: ["Notion: Acme workspace"],
    profilePath: "vault/acme/universe.md",
  });

  assert.deepEqual(verdict, {
    status: "undeclared",
    line:
      "This universe declares no Slack account, and I could not find out which workspace " +
      "the connector is on either — so there is nothing to check, and nothing to record.",
  });
});

test("a declared Slack goes through the full comparison, divergence and all", () => {
  const verdict = checkSlackAccount({
    entries: ["Slack: acme.slack.com"],
    observed: "globex",
    profilePath: "vault/acme/universe.md",
  });

  assert.deepEqual(verdict, {
    status: "diverging",
    line:
      "Slack is on 'globex' — this universe declares 'acme'. " +
      "Do not read or file Slack data here until the connector is reconnected to 'acme'.",
  });
});
