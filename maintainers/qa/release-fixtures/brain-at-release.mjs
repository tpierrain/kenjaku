// ═══════════════════════════════════════════════════════════════════════════
// brain-at-release.mjs — how a QA suite builds a brain as the installer of a
// published tag left it, and runs one real update over it.
//
// Extracted from `scripts/lib/release-fixture-refresh.test.mjs` when a second
// suite needed the same brain (the doctrine QA, plan § The QA instrument).
// Duplicating it is how two QA files start disagreeing about what a brain at a
// release looks like — and the disagreement would be invisible, since both
// would be green.
//
// Lives under `maintainers/` on purpose: dev-only prefix, never copied into a
// brain, exactly like the fixtures it reads.
// ═══════════════════════════════════════════════════════════════════════════
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { defaultGit } from "../../../scripts/lib/engine-fetch.mjs";
import { reconcileBrain } from "../../../scripts/lib/reconcile-brain.mjs";
// The PRODUCTION digest, deliberately: a hand-rolled sha256 in the test would silently
// disagree with the manifest's format and turn every untouched skill into "customized".
import { fingerprint } from "../../../scripts/lib/engine-source.mjs";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const FIXTURES = join(REPO, "maintainers", "qa", "release-fixtures");

export const readRepo = (rel) => readFileSync(join(REPO, rel), "utf8");
export const readBrain = (brainDir, rel) => readFileSync(join(brainDir, rel), "utf8");

export function writeFile(root, rel, content) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
}

// The skill files the fixture carries, as brain-relative POSIX paths.
export function skillFilesOf(tag) {
  const skills = {
    "v3.6.0": [".claude/skills/switch/SKILL.md", ".claude/skills/prepare-1-1/SKILL.md"],
    "v3.2.2": [".claude/skills/import/SKILL.md"],
  };
  return skills[tag];
}

// A brain as the installer of `<tag>` left it: that release's skills, that release's
// manifest, and the provenance base the installer records for every `merge` file it
// delivers — the sha256 of the very bytes it wrote. `edits` overwrites a skill AFTER
// the base is computed, which is exactly what a user customization looks like on disk.
export function brainAtRelease(tag, { edits = {} } = {}) {
  const brainDir = mkdtempSync(join(tmpdir(), `sbg-qa-${tag}-`));
  cpSync(join(FIXTURES, tag), brainDir, { recursive: true });
  const manifest = JSON.parse(readBrain(brainDir, "engine-manifest.json"));
  const provenance = {};
  for (const rel of skillFilesOf(tag)) provenance[rel] = fingerprint(readBrain(brainDir, rel));
  manifest.provenance = provenance;
  // The sacred trio, so the QA also observes that a refresh leaves them alone.
  writeFile(brainDir, "CLAUDE.md", "# My constitution\nI tailored this.\n");
  writeFile(brainDir, ".env", "GOOGLE_GEMINI_API_KEY=secret\n");
  writeFile(brainDir, ".claude/settings.json", '{\n  "mine": true\n}\n');
  for (const [rel, content] of Object.entries(edits)) writeFile(brainDir, rel, content);
  return { brainDir, manifest };
}

// 🛑 THE ONLY GIT THIS QA IS ALLOWED TO SPAWN (S7-5-3). The ancestor fetch runs a real
// `git fetch origin tag <tag>` — and the "source" here is THIS REPOSITORY, whose tags are
// already local. Letting the real runner through would put a NETWORK CALL inside a suite
// that says "no network" in its own header, and a suite that needs the internet is a
// suite that fails at random. Random failure is not noise in this repo: under the mutation
// runner a suite that exits non-zero IS the kill signal, so a flaky test does not add
// noise to a score, it adds points (RESULTS.md, top box).
//
// So `fetch` is answered `ok` without touching the network, and everything else — the
// `git show <tag>:<path>` that produces the ancestor's actual bytes — goes to real git in
// the real repository. The QA keeps reading REAL released content, which is its whole
// reason to exist; only the round-trip that would have downloaded what is already on disk
// is skipped.
export function localTagGit(args, run = defaultGit) {
  return args[2] === "fetch" ? { out: "", ok: true } : run(args);
}

// Everything the reconciler does to the world, stubbed: this QA is about file content.
export function seams() {
  const calls = { install: [], reindex: [] };
  return {
    calls,
    regenerateLaunchers: async () => {},
    runInstall: async ({ ragDir }) => calls.install.push(ragDir),
    runReindex: async ({ brainDir }) => calls.reindex.push(brainDir),
    countVaultNotes: async () => 0,
    git: localTagGit,
  };
}

// One real update: the repository at HEAD is the fetched source (`sourceDir !== brainDir`,
// i.e. the auto-finalize child of an explicitly-requested update).
export async function updateFrom(brainDir, local) {
  const { calls, ...s } = seams();
  const target = JSON.parse(readRepo("engine-manifest.json"));
  return reconcileBrain({ brainDir, platform: "posix", sourceDir: REPO, target, local, ...s });
}
