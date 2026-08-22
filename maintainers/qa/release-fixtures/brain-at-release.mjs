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
import { fingerprint, reseedBaseRefs, reseedProvenance } from "../../../scripts/lib/engine-source.mjs";
// The PRODUCTION rewriter too, for the same reason as the digest: a hand-rolled
// `split("\n").join("\r\n")` here would disagree with what the engine calls a CRLF
// form the day one of them learns about a lone `\r`, and the QA would be green about
// a byte-state no Windows brain holds.
import { crlfify } from "../../../scripts/lib/engine-base.mjs";

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
// 🇫🇷 A brain is not French because one of its files holds French bytes — it is French
// because `scripts/lib/demo-locale.mjs` SAYS SO. That file is what `readBrainLocale`
// reads, it is locale-owned so an update never overwrites it, and the installer is the
// only thing that ever writes it. The fixture tree is PARTIAL and does not carry it, so
// a fixture built without this option is an English brain whatever else is edited into
// it — which is precisely how the FR pole came to measure the wrong thing for a day.
// The marker is taken from the TAG's own `templates/<locale>/` overlay, never invented
// here, for the same reason the doctrine blob is.
function localeMarkerAtTag(tag, locale) {
  return defaultGit(["show", `${tag}:templates/${locale}/scripts/lib/demo-locale.mjs`]).out;
}

export function brainAtRelease(tag, { edits = {}, locale, eol } = {}) {
  const brainDir = mkdtempSync(join(tmpdir(), `sbg-qa-${tag}-`));
  cpSync(join(FIXTURES, tag), brainDir, { recursive: true });
  if (locale) writeFile(brainDir, "scripts/lib/demo-locale.mjs", localeMarkerAtTag(tag, locale));
  // 🪟 `eol: "crlf"` builds the WINDOWS brain, and it is not a costume. Git for Windows
  // defaults `core.autocrlf` to true, so a launcher cloned there has a CRLF working
  // tree; `installer.mjs` lists the tracked files and `copyFileSync`s each one from
  // that tree, byte-verbatim, no encoding pass. A brain's engine bytes ARE its
  // launcher checkout's bytes, CRLF from install day.
  //
  // Applied BEFORE the provenance loop, and that ordering is the whole defect: the
  // installer digests the bytes it wrote, so the record is a CRLF digest — and no row
  // of the fingerprint table is ever CRLF, since every row is folded from a git blob
  // and the object store holds LF.
  if (eol === "crlf") for (const rel of skillFilesOf(tag)) writeFile(brainDir, rel, crlfify(readBrain(brainDir, rel)));
  const manifest = JSON.parse(readBrain(brainDir, "engine-manifest.json"));
  const provenance = {};
  for (const rel of skillFilesOf(tag)) provenance[rel] = fingerprint(readBrain(brainDir, rel));
  manifest.provenance = provenance;
  // On the DISK too, not only in the object handed back: an installer writes what it
  // recorded, and everything that reads the brain back (the standing divergence report,
  // an adoption) reads this file rather than the caller's copy.
  writeFile(brainDir, "engine-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
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

// 🛑 THE HALF THE RECONCILER DOES NOT DO, and S10-QA is what needed it. `reconcileBrain`
// converges FILES and never writes the manifest: on the real update path that write is
// step 7 of `update-engine.mjs` (and the auto-finalize child after it). A fixture that
// stops at the reconcile leaves the brain carrying its INSTALL-DAY manifest — empty
// provenance, no `baseRefs` — a state no brain is ever in after a real update. Every
// suite that only reads the report never noticed; the moment a suite reads the brain
// BACK (the adoption QA asks what the brain still holds back, then answers it), the
// fixture would have been measuring a fiction.
//
// Mirrored on step 7 line for line, including what it does NOT advance: `regimes` come
// from `local`, so a brain keeps its install-day regime list forever. That is a real
// engine behaviour (`session-self-heal.mjs` calls it out: "update-engine never refreshes
// those"), and reproducing it is the point — a fixture that quietly advanced the regimes
// would make the QA green about a fleet that is not.
function finalizeManifest({ brainDir, target, local, report }) {
  const deliveredFileMap = { ...report.installedFileMap, ...report.refreshedFileMap };
  const updated = {
    ...local,
    engineVersion: target.engineVersion,
    indexSchemaVersion: target.indexSchemaVersion,
    provenance: reseedProvenance({
      priorProvenance: report.healedProvenance ?? local.provenance ?? {},
      manifest: target,
      deliveredFileMap,
    }),
    baseRefs: reseedBaseRefs({
      priorBaseRefs: { ...report.healedBaseRefs, ...(local.baseRefs ?? {}) },
      manifest: target,
      deliveredFileMap,
      ref: local.source?.ref,
    }),
  };
  writeFile(brainDir, "engine-manifest.json", `${JSON.stringify(updated, null, 2)}\n`);
}

// One real update: the repository at HEAD is the fetched source (`sourceDir !== brainDir`,
// i.e. the auto-finalize child of an explicitly-requested update) — then the manifest
// write that always follows it in the field.
export async function updateFrom(brainDir, local) {
  const { calls, ...s } = seams();
  const target = JSON.parse(readRepo("engine-manifest.json"));
  const report = await reconcileBrain({ brainDir, platform: "posix", sourceDir: REPO, target, local, ...s });
  finalizeManifest({ brainDir, target, local, report });
  return report;
}
