// ─────────────────────────────────────────────────────────────────────────────
// connector-accounts.mjs — a DECLARED connector account is not a VERIFIED one.
//
// A universe profile carries a hand-typed `## Connector accounts` section
// (`- Slack: acme.slack.com`), and the digest used to quote it as if it were a
// fact. It is a claim: the native MCP connectors are single-account and do NOT
// follow a `/switch` (ADR 0034), so after switching spheres the brain can fetch
// one organisation's data and file it under another's while displaying the right
// answer on screen.
//
// Only the model can ask Slack (an MCP call is the one door), so the split is:
// the model OBSERVES, this module CLASSIFIES, COMPARES and WORDS the verdict —
// a string comparison is not the LLM's job (ADR 0009).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The connector-accounts block of the `[working context]` digest, built from the
 * profile's own `## Connector accounts` bullets (already stripped of their dash by
 * the digest's section reader). Pure; returns 0, 1 or 2 lines.
 *
 * Two lines rather than one, deliberately: the first says WHAT the page claims and
 * that it is only a claim, the second is the GESTURE that settles it. A rule with
 * no gesture is a rule nothing ever runs — the pattern this release keeps meeting.
 */
export function renderConnectorAccounts(entries) {
  if (!entries.length) return [];
  const declared = [
    `Connector accounts, as DECLARED on this page (a claim, never verified): ${entries.join(", ")}.`,
  ];
  if (!entries.some((entry) => isVerifiable(toolOf(entry)))) return declared;
  return [
    ...declared,
    "Slack can be checked, and here it must be: before reading or filing anything from Slack " +
      "in this universe, observe the workspace a Slack result names, then run " +
      '`node scripts/set-universe-profile.mjs --check-slack "<workspace>"`.',
  ];
}

// `Slack: acme.slack.com` → `Slack`. The account may itself contain a colon (a URL
// does), so only the FIRST one separates the tool from what it names.
const toolOf = (entry) => String(entry).split(":")[0];

/**
 * The whole verdict for `--check-slack`, from the profile's own bullets and the
 * workspace the model observed. Pure, and the ONE place every outcome is worded:
 * a caller that composed its own sentence for one of them would be a second
 * opinion on what "verified" means.
 */
export function checkSlackAccount({ entries, observed, profilePath }) {
  // No page at all is the normal state of every brain installed before profiles
  // existed — told apart from a page that simply declares no Slack, because the
  // gesture that fixes them is not the same one.
  if (entries === null) {
    return {
      status: "undeclared",
      line:
        `This universe has no profile page yet, so it declares no accounts to check ` +
        `against. Slack is on '${slackWorkspace(observed ?? "")}'. ` +
        "`/switch` can describe this sphere, accounts included.",
    };
  }
  const declared = declaredAccountFor(entries, "Slack");
  // Nothing declared is not a mismatch: there is no claim to contradict. It is the
  // moment to OFFER the declaration, since the workspace is right there.
  if (declared === null) {
    const workspace = slackWorkspace(observed ?? "");
    // Both halves unknown at once (a page that names other tools, and a Slack that
    // did not answer): offering `- Slack: ` would hand the owner a declaration of
    // nothing to paste into their profile — a claim about a tool, made out of thin
    // air, which is the very thing this check exists to stop.
    if (!workspace) {
      return {
        status: "undeclared",
        line:
          `This universe declares no Slack account, and I could not find out which workspace ` +
          `the connector is on either — so there is nothing to check, and nothing to record.`,
      };
    }
    return {
      status: "undeclared",
      line:
        `This universe declares no Slack account, so there is nothing to check against. ` +
        `Slack is on '${workspace}'; if that is the right workspace here, add ` +
        `\`- Slack: ${workspace}\` under \`## Connector accounts\` in ${profilePath}.`,
    };
  }
  return compareConnectorAccount({ tool: "Slack", declared, observed });
}

/**
 * What a profile's `## Connector accounts` bullets declare for one tool, or null
 * when that tool is not declared at all. Pure.
 */
export function declaredAccountFor(entries, tool) {
  const wanted = String(tool).trim().toLowerCase();
  const hit = entries.find((entry) => toolOf(entry).trim().toLowerCase() === wanted);
  return hit === undefined ? null : hit.slice(hit.indexOf(":") + 1).trim();
}

// The connectors that can answer "which account am I on?" cleanly enough to build
// a verdict on. Slack is the whole list ON PURPOSE (owner, 2026-08-05): it is where
// the mistake costs the most and the one that answers without ambiguity. Widening
// this list is a decision, not a detail — every tool added here must have a cheap,
// unambiguous way to name the account, or the check starts inventing certainty.
const VERIFIABLE_TOOLS = ["slack"];

const isVerifiable = (tool) => VERIFIABLE_TOOLS.includes(String(tool).trim().toLowerCase());

/**
 * Compares what a universe DECLARES against what the connector was observed to
 * be on. Pure.
 */
export function compareConnectorAccount({ tool, declared, observed }) {
  if (!isVerifiable(tool)) {
    return {
      status: "unverified",
      line:
        `${tool}: this universe declares '${declared}' — declared, never verified ` +
        `(nothing asks ${tool} which account it is on). Treat it as a claim.`,
    };
  }
  const want = slackWorkspace(declared);
  const got = slackWorkspace(observed ?? "");
  // Nothing observed is NOT a divergence: it would send the owner to reconnect a
  // connector that may be perfectly fine. "I could not find out" is its own answer
  // (the same call taken for `--check` at 14.2), and it is said out loud.
  if (!got) {
    return {
      status: "unverified",
      line:
        `Slack: this universe declares '${want}' — I could not find out which workspace ` +
        `the connector is actually on. Treat it as a claim.`,
    };
  }
  if (got === want) {
    return {
      status: "matching",
      line: `Slack is on '${want}', which is what this universe declares (observed, not assumed).`,
    };
  }
  return {
    status: "diverging",
    line:
      `Slack is on '${got}' — this universe declares '${want}'. ` +
      `Do not read or file Slack data here until the connector is reconnected to '${want}'.`,
  };
}

// A Slack workspace names itself in as many shapes as the places it is read from:
// a person types `acme.slack.com`, a permalink carries
// `https://acme.slack.com/archives/…`, an API field says `acme`. All three are the
// same workspace, and a comparison that cannot see that would cry divergence on a
// correctly connected brain — the failure mode CONVENTIONS.md §5quater is about.
export function slackWorkspace(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/\.slack\.com.*$/, "");
}
