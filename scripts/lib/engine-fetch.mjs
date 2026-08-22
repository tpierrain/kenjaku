// ─────────────────────────────────────────────────────────────────────────────
// engine-fetch.mjs — resolve + fetch the pinned launcher ref a brain records in
// `source: {repo, ref}` (plan Step 2). Shallow-clones that ref into a fresh temp
// dir and returns the dir — the REAL implementation of the Gate's `fetchSource`
// seam (drop-in: same `{repo, ref} → dir` contract). It also reads the FETCHED
// engine-manifest.json so the apply step (Step 3/4) can compare versions/schema.
//
// git spawn + temp-dir creation are INJECTED so the unit tests run offline and
// deterministically (no network, no real git). Cross-platform (ADR 0015): the
// clone argv is platform-agnostic — git is a real .exe on Windows (no shell
// wrapper, unlike npm.cmd), so no `process.platform` branch is needed here.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { pickLatestSemverTag } from "./semver-tag.mjs";

// The exact git argv to shallow-clone a single pinned ref into `dir`. Pure so the
// command is unit-asserted and proven identical on every platform.
//
// 🪟 `-c core.autocrlf=false` (plan W2) is the half that stops the Windows defect
// RECURRING — W1 repairs the brains that already have it. Git for Windows defaults
// `core.autocrlf` to **true**, so without this the updater's source tree is CRLF,
// every byte it delivers is CRLF, and the brain re-records a digest no row of the
// fingerprint table can match (the table is folded from git blobs, and the object
// store holds LF). The fleet would need W1's candidate walk at every update forever
// instead of converging on LF at the first one.
//
// It pins `core.autocrlf` and NOTHING ELSE, deliberately: an explicit `eol=`
// attribute is a different mechanism and it wins regardless, so `.gitattributes`'
// `*.cmd text eol=crlf` still produces the CRLF batch files Windows needs. Those
// two rules being opposite is exactly the trap that file's own comment warns about.
export function buildCloneArgs({ repo, ref, dir }) {
  return [
    "-c",
    "core.autocrlf=false",
    "clone",
    "--depth",
    "1",
    "--branch",
    ref,
    "--single-branch",
    repo,
    dir,
  ];
}

// The git argv that lists the remote's TAG refs (no dereferenced `^{}` peels,
// thanks to --refs). Pure so the command is unit-asserted and identical on every
// platform (git is a real .exe on Windows — no shell branch needed, ADR 0015).
export function buildLsRemoteArgs(repo) {
  return ["ls-remote", "--tags", "--refs", repo];
}

// The launcher's CURRENT engine version = the HIGHEST semver release tag on the
// remote (ADR 0017). `update-engine` resolves it, fetches it, and records it as the
// brain's new `source.ref` so the displayed Version actually advances. Returns null
// when the remote is unreachable or carries no semver tag → the caller falls back to
// the pinned ref (dev branches, offline) rather than breaking the update. `git`
// (args[] → {out, ok}) is injected so the unit tests run offline.
export function resolveLatestTag({ repo, git = defaultGit }) {
  if (!repo) return null;
  const { ok, out } = git(buildLsRemoteArgs(repo));
  if (!ok) return null;
  return pickLatestSemverTag(parseTagRefs(out));
}

// The tag names in a `ls-remote --tags --refs` payload — each line is
// "<sha>\trefs/tags/<name>", and --refs already dropped the ^{} peels. Exported
// because the update CHECK reads the very same output for every intermediate tag:
// two spellings of this parse would be two opinions on which releases exist.
export function parseTagRefs(out) {
  return (out ?? "")
    .split("\n")
    .map((line) => {
      const m = /\srefs\/tags\/(.+)$/.exec(line);
      return m ? m[1].trim() : null;
    })
    .filter(Boolean);
}

// Shallow-clone the recorded launcher at the pinned ref into a fresh temp dir and
// return that dir (drop-in for the Gate's `fetchSource` seam). `git` (args[] →
// {out, ok}) and `makeTempDir` are injected so tests stub the spawn (offline).
export async function fetchSource({
  repo,
  ref,
  git = defaultGit,
  makeTempDir = () => mkdtempSync(join(tmpdir(), "sbg-engine-src-")),
  removeDir = (d) => rmSync(d, { recursive: true, force: true }),
}) {
  if (!repo) {
    throw new Error(
      "update-engine: no source repo recorded in the brain's manifest — cannot fetch an update automatically.",
    );
  }
  const dir = makeTempDir();
  const { ok, out } = git(buildCloneArgs({ repo, ref, dir }));
  if (!ok) {
    removeDir(dir); // never leave a half-cloned temp dir behind
    // Actionable, because this is the ONLY screen a failed update leaves an owner:
    // name the address, blame the ADDRESS rather than declare the project dead (the
    // same failure covers "moved" and "no signal"), and name the one line that
    // repairs a move — `source.repo`, in a file nobody would think to open.
    throw new Error(
      `update-engine: git clone of ${repo}@${ref} failed — that address did not answer.\n${out}\n` +
        `If the project moved, correct \`source.repo\` in your brain's engine-manifest.json; ` +
        `otherwise check your internet connection and try again.`,
    );
  }
  return dir;
}

// Read the FETCHED launcher's engine-manifest.json → the target the brain compares
// against: the engineVersion vector, indexSchemaVersion and regimes that drive the
// apply plan (Step 3). Pure read (the dir is already on disk from fetchSource).
export function readTargetManifest(dir, read = (p) => readFileSync(p, "utf8")) {
  return JSON.parse(read(join(dir, "engine-manifest.json")));
}

// The exact git invocation, as a VALUE — command, argv and spawn options. Pure,
// so what is actually run is asserted whole instead of being inspected through a
// spawn nobody calls (debt 2 of the v4.8.0 mutation pass; same shape as
// buildCrosscheckInvocation in verify-index.mjs, which killed the identical
// cluster at v4.5.0). No platform branch: git is a real executable on Windows
// too, so this request is byte-identical everywhere — see the module header.
// The ceiling on what a git child may hand back, shared by every git seam in the
// product so there is ONE number to reason about (F10 of the v5.0.0 review). Node's
// default is 1 MB, and overflowing it does not truncate — the child is killed and the
// call THROWS, which every runner here maps to "git said no". The failure therefore
// arrives wearing the wrong clothes: `defaultGit` reports the update server as
// unreachable, and the session banner reports a broken repository. Both are false, and
// both happen precisely on the biggest brains.
//
// `git show <ref>:<path>` carries whole file bytes; `git status --porcelain` carries one
// line per dirty file. Neither has a bound this side of the vault's own size.
export const GIT_MAX_BUFFER = 64 * 1024 * 1024;

export function buildGitInvocation(args) {
  return {
    command: "git",
    args,
    options: { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: GIT_MAX_BUFFER },
  };
}

// Real git runner (args[] → {out, ok}), shared convention with auto-push.mjs.
// Exported so the update CHECK runs the very same runner: two spellings of "ask
// git" would be two behaviours to keep in step forever. `execFile` is a seam so
// the forwarding and the ok/failure mapping are asserted without a real git.
export function defaultGit(args, execFile = execFileSync) {
  const { command, args: argv, options } = buildGitInvocation(args);
  try {
    const out = execFile(command, argv, options);
    return { out: out ?? "", ok: true };
  } catch (e) {
    return { out: `${e.stdout ?? ""}${e.stderr ?? ""}`, ok: false };
  }
}
