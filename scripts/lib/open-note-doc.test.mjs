import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildOpenNoteCommand } from "./open-note.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The opening rule, as the docs state it (F17) — doc guards, because here the DOCS
// ARE the defect. Three surfaces gave three different answers: the constitution said
// Obsidian is "never the mechanism", the `open-note` skill said "always Obsidian" via
// a macOS-only `open -a` that (measured, 2026-08-03) never opens the requested note at
// all, and `obsidian-health` already promised the user that citations "open straight
// in it". These guards pin all three to `buildOpenNoteCommand`, so the rule has one
// owner and the prose cannot drift back into three.
// ═══════════════════════════════════════════════════════════════════════════

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(repoRoot, rel), "utf8");

// The URI prefix is READ OFF the function, never typed here: if the mechanism ever
// changes, these guards demand the docs change with it instead of quietly passing.
const uriPrefix = (() => {
  const { args } = buildOpenNoteCommand({
    platform: "darwin",
    absPath: "/x/vault/n.md",
    insideVault: true,
    obsidianOk: true,
  });
  return args[0].slice(0, args[0].indexOf("=") + 1);
})();

const CONSTITUTIONS = [
  ["CLAUDE.engine.md", "### Opening / viewing / editing a note"],
  ["templates/fr/CLAUDE.engine.md", "### Ouvrir / consulter / éditer une note"],
];

// Every surface that can teach the agent how to open a note.
const OPENING_SURFACES = [
  "CLAUDE.engine.md",
  "templates/fr/CLAUDE.engine.md",
  "engine-skills/open-note/SKILL.md",
  "SETUP.md",
];

test("no surface prescribes `open -a \"Obsidian\"` — measured, it ignores the file", () => {
  const offenders = OPENING_SURFACES.flatMap((file) =>
    read(file)
      .split("\n")
      .map((line, i) => [file, i + 1, line])
      .filter(([, , line]) => /open\s+-a\s+["']?Obsidian/.test(line))
      // The rule itself must be free to NAME the trap in order to forbid it.
      .filter(([, , line]) => !/never|jamais/i.test(line)),
  );
  assert.deepEqual(
    offenders,
    [],
    "`open -a \"Obsidian\" <path>` launches Obsidian on its restored session and never opens the " +
      "requested note (measured 2026-08-03, cold and warm) — and it is macOS-only. Prescribe " +
      `\`${uriPrefix}…\` instead:\n${offenders.map(([f, n, l]) => `${f}:${n} ${l.trim()}`).join("\n")}`,
  );
});

test("SETUP.md — the reading chapter warns about Obsidian's one-time external-link prompt", () => {
  const setup = read("SETUP.md");
  assert.match(
    setup,
    /external link/i,
    "Obsidian gates every `obsidian://` open behind a trust prompt until the owner ticks " +
      "\"Don't ask again\" once (field-verified 2026-08-03). An owner who meets that modal with " +
      "nothing in SETUP.md about it reads it as the brain doing something shady — say it up front, " +
      "the same calm way as the one-time \"Always allow\" step",
  );
});

for (const [file, heading] of CONSTITUTIONS) {
  test(`${file} — the opening section routes a vault note through the Obsidian URI`, () => {
    const doc = read(file);
    const start = doc.indexOf(heading);
    assert.notEqual(start, -1, `${file} no longer has a section starting with "${heading}"`);
    const rest = doc.slice(start + heading.length);
    const end = rest.indexOf("\n## ");
    const section = end === -1 ? rest : rest.slice(0, end);
    assert.ok(
      section.includes(uriPrefix),
      `${file}'s opening section must name \`${uriPrefix}…\` for a note that belongs to the vault — ` +
        "it is the ONLY mechanism that actually opens the requested note (ADR 0038)",
    );
  });
}
