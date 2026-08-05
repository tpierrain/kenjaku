import test from "node:test";
import assert from "node:assert/strict";

import { compareConnectorAccount, renderConnectorAccounts } from "./connector-accounts.mjs";

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
