#!/usr/bin/env node
// A FIELD REHEARSAL: run the release against a copy of a brain that really exists,
// driven by THE ENGINE THAT BRAIN ALREADY HAS — not by HEAD's.
//
// Why this exists, and why no automated suite replaces it. In the field, an update is
// performed by the OLD engine: the installed `scripts/update-engine.mjs` fetches the
// new release and hands off to it. Every test in the repo — unit, integration, release
// fixtures — calls HEAD's code, so the one thing they structurally cannot observe is
// that handoff. On 2026-08-22 that blind spot hid a release-stopping defect: v5's first
// update converged NOTHING on either of the two real brains, and told their owner they
// were up to date. This harness is what found it, kept so the next release can be put
// through the same trial before it ships.
//
// Nothing here can touch an original brain: the copy is taken WITHOUT its `.git`, so it
// carries no remote, and every path written lives under the work directory.
//
// Usage, from the repo root:
//   node maintainers/qa/field-rehearsal/rehearse.mjs --brain ~/some-brain
//   node maintainers/qa/field-rehearsal/rehearse.mjs --brain ~/some-brain --tag v5.0.0
//
// Read the three things it prints, in this order:
//   1. STATE before / STATE after   — did the release actually land? (see README)
//   2. THE REPORT THE OWNER WOULD READ — is the truth of 1. what it says?
//   3. THE OWNER'S TERRITORY         — must be byte-identical, always.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { chmodSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");

// The vault, and the three files an owner edits by hand. An update may add to the
// engine's own territory as much as it likes; if it moves a byte HERE, it is a bug.
const OWNER_TERRITORY = ["vault", "CLAUDE.md", ".claude/settings.json", ".claude/settings.local.json", ".env"];

function usage(message) {
  console.error(`${message}\n\nUsage: node maintainers/qa/field-rehearsal/rehearse.mjs --brain <path> [--tag v5.0.0] [--work <dir>]`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = { tag: "v5.0.0", work: join(tmpdir(), "kenjaku-field-rehearsal") };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    if (!["brain", "tag", "work"].includes(key) || argv[i + 1] === undefined) usage(`Unknown or incomplete option: ${argv[i]}`);
    args[key] = argv[i + 1];
  }
  if (!args.brain) usage("Missing --brain <path to a brain to rehearse against>");
  args.brain = resolve(args.brain.replace(/^~(?=\/|$)/, process.env.HOME ?? "~"));
  if (!existsSync(join(args.brain, "engine-manifest.json"))) usage(`Not a brain (no engine-manifest.json): ${args.brain}`);
  return args;
}

function git(cwd, ...argv) {
  const run = spawnSync("git", ["-c", "user.email=qa@example.com", "-c", "user.name=QA", ...argv], { cwd, encoding: "utf8" });
  if (run.status !== 0) throw new Error(`git ${argv.join(" ")} failed in ${cwd}:\n${run.stderr || run.stdout}`);
  return run.stdout.trim();
}

// A bare clone of this working repo, with the release tag forced onto the current HEAD.
// The brain will be pointed at it, so the rehearsal fetches the code under review and
// never the published one.
function buildMirror(work, tag) {
  const mirror = join(work, "launcher.git");
  rmSync(mirror, { recursive: true, force: true });
  spawnSync("git", ["clone", "--bare", "--quiet", REPO, mirror], { encoding: "utf8" });
  const head = git(REPO, "rev-parse", "HEAD");
  git(mirror, "tag", "-f", tag, head);
  console.log(`▶ mirror ${mirror}\n  ${tag} → ${head.slice(0, 7)} ${git(REPO, "log", "-1", "--format=%s", head)}`);
  return mirror;
}

// A pristine copy, minus everything that would tie it back to the original or take
// minutes to duplicate. It becomes its own git repo so the update can commit into it.
function copyBrain(brain, work, mirror) {
  // `basename`, NOT `split("/").pop()`: `brain` and the `src` handed to the filter are OS
  // paths, and a Windows one carries no `/` — the split would return the whole path, so the
  // skip set would match nothing and the copy would drag `.git` (a remote, and a push that
  // could reach the owner's real brain) plus every `node_modules`.
  const copy = join(work, `${basename(brain)}-copy`);
  const skipped = new Set([".git", "node_modules", ".cache"]);
  rmSync(copy, { recursive: true, force: true });
  cpSync(brain, copy, { recursive: true, filter: (src) => !skipped.has(basename(src)) });
  git(copy, "init", "-q");
  git(copy, "add", "-A");
  git(copy, "commit", "-qm", "the brain as it stands today");

  const manifestPath = join(copy, "engine-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const installedAt = manifest.source?.ref;
  manifest.source.repo = mirror;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  git(copy, "commit", "-qam", "point at the local mirror");
  console.log(`▶ copy   ${copy}\n  installed at ${installedAt}`);
  return copy;
}

// `npm install` / `npm run reindex` are network and model work, and this trial is about
// what the update WRITES INTO THE BRAIN. Everything else in the run is the real engine.
function stubNpm(work) {
  const bin = join(work, "fakebin");
  mkdirSync(bin, { recursive: true });
  const stub = join(bin, "npm");
  writeFileSync(stub, `#!/bin/sh\necho "[rehearsal] npm $* — stubbed (cwd: $PWD)"\nexit 0\n`);
  chmodSync(stub, 0o755);
  return bin;
}

// What an owner would actually have, read off the copy's disk — the four questions the
// unfreeze has to answer with a yes.
function state(brainDir, label) {
  const manifest = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  const merge = manifest.regimes?.merge ?? [];
  const doctrine = join(brainDir, "CLAUDE.engine.md");
  const base = join(brainDir, ".engine-base");
  console.log(`\n── STATE ${label}`);
  console.log("   source.ref            :", manifest.source?.ref);
  console.log("   merge families        :", merge.length, "| doctrine among them:", merge.includes("CLAUDE.engine.md"));
  console.log("   retired               :", JSON.stringify(manifest.retired ?? "(absent)"));
  console.log("   baseRefs              :", JSON.stringify(manifest.baseRefs ?? {}));
  console.log("   CLAUDE.engine.md      :", existsSync(doctrine) ? `${readFileSync(doctrine, "utf8").split("\n").length} lines` : "ABSENT");
  console.log("   .engine-base entries  :", existsSync(base) ? readdirSync(base, { recursive: true }).filter((f) => /\.(md|mjs|json)$/.test(String(f))).length : 0);
}

const { brain, tag, work } = parseArgs(process.argv.slice(2));
mkdirSync(work, { recursive: true });
console.log(`\n════════════ FIELD REHEARSAL — ${brain} ════════════\n`);
const mirror = buildMirror(work, tag);
const copy = copyBrain(brain, work, mirror);
const before = git(copy, "rev-parse", "HEAD");
state(copy, "BEFORE the update");

// The handoff, and the whole point of this file: the driver imports the update-engine
// that is ALREADY IN THE COPY, so the run starts in the old code exactly as it does on
// a real machine.
const driver = `
  const { updateEngine, formatReport } = await import(process.argv[1] + "/scripts/update-engine.mjs");
  const report = await updateEngine({ brainDir: process.argv[1] });
  console.log("\\n════════ THE REPORT THE OWNER WOULD READ ════════\\n");
  console.log(formatReport(report));
`;
const run = spawnSync(process.execPath, ["--input-type=module", "--eval", driver, copy], {
  encoding: "utf8",
  env: { ...process.env, PATH: `${stubNpm(work)}:${process.env.PATH}` },
});
process.stdout.write(run.stdout ?? "");
if (run.stderr) process.stderr.write(run.stderr);

state(copy, "AFTER the update");

// The invariant that outranks every other reading here. An update that delivers the
// whole release but edits one byte of a note has still failed. Staged against the
// pre-update commit, so it reads the same whether the update committed its work or
// left it in the working tree — and `add -A` brings any file it CREATED into view too.
git(copy, "add", "-A");
const territory = git(copy, "diff", "--cached", "--stat", before, "--", ...OWNER_TERRITORY);
console.log("\n── THE OWNER'S TERRITORY (vault + hand-edited files)");
console.log(territory === "" ? "   ✅ byte-identical — the update touched nothing the owner owns." : `   🚨 TOUCHED:\n${territory}`);
process.exit(run.status === 0 && territory === "" ? 0 : 1);
