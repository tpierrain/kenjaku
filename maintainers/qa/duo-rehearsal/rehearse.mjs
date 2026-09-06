#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// A DUO REHEARSAL: two people, two machines, one private repository — the whole
// duo path driven end to end, through real git and real entry points.
//
// Why this exists, and why no unit test replaces it. Every piece of duo mode is
// tested on its own: the key composer, the lookup, the writer guard, the dated-note
// rule, the merge scope. What none of them can observe is the thing that actually
// has to work — that the key one machine WRITES is the key the other machine
// COMPOSES, days later, from different raw fields handed back by a different
// connector, after travelling through a git merge. That agreement is the whole
// feature, and it lives between the parts rather than inside any of them.
//
// Nothing here can touch a real brain: the scratch brain is built from this repo's
// own `scripts/` and `.gitattributes` inside a temporary directory, and the only
// remote it ever has is a bare repo created beside it.
//
// Usage, from the repo root:
//   node maintainers/qa/duo-rehearsal/rehearse.mjs
//   node maintainers/qa/duo-rehearsal/rehearse.mjs --keep   (leave the scratch brain on disk)
//
// Exit 0 when every claim held, 1 otherwise — and a failure prints what it saw, not
// merely that it failed.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const KEEP = process.argv.includes("--keep");

const THOMAS = "Thomas Pierrain";
const CLAIRE = "Claire Dubois";
const DAY = "2026-09-03";

// ONE mail, met twice, spelled the two ways two connectors really spell it: a display
// name and an offset timezone on one side, a bare address and UTC on the other. If the
// normalizer is wrong anywhere, this is the pair that shows it.
const AS_THOMAS_SEES_IT = [
  "--type", "mail",
  "--from", "Facturation <Billing@Example.COM>",
  "--date", "2026-09-03T11:14:00+02:00",
  "--subject", "Votre facture, est prête !",
];
const AS_CLAIRE_SEES_IT = [
  "--type", "mail",
  "--from", "billing@example.com",
  "--date", "2026-09-03T09:14:00Z",
  "--subject", "Votre Facture Est Prête",
];

let passed = 0;
const failures = [];
function claim(what, held, detail = "") {
  if (held) {
    passed += 1;
    console.log(`  ✅ ${what}`);
  } else {
    failures.push(what);
    console.log(`  ❌ ${what}${detail ? `\n     ${detail.trim().split("\n").join("\n     ")}` : ""}`);
  }
}

// ── The scratch brain ────────────────────────────────────────────────────────
const root = mkdtempSync(join(tmpdir(), "kenjaku-duo-rehearsal-"));
const bare = join(root, "origin.git");
const thomas = join(root, "thomas");
const claire = join(root, "claire");

const gitIn = (cwd) => (...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// The entry points are run AS PROCESSES, from the brain folder, exactly as a skill runs
// them — argv, exit code and stdout are the contract, and none of them is exercised by
// importing the module.
function run(cwd, script, args) {
  const done = spawnSync(process.execPath, [join("scripts", script), ...args], { cwd, encoding: "utf8" });
  return { status: done.status, out: done.stdout ?? "", err: done.stderr ?? "" };
}

function buildScratchBrain() {
  execFileSync("git", ["init", "--quiet", "--bare", "--initial-branch=main", bare]);

  mkdirSync(join(thomas, "scripts"), { recursive: true });
  for (const zone of ["daily", "people", "raw-sources"]) mkdirSync(join(thomas, "vault", zone), { recursive: true });
  cpSync(join(REPO, "scripts"), join(thomas, "scripts"), { recursive: true });
  // The shipped merge rule, byte for byte: rehearsing against a hand-written copy would
  // prove something about the copy.
  cpSync(join(REPO, ".gitattributes"), join(thomas, ".gitattributes"));

  const git = gitIn(thomas);
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", THOMAS);
  git("config", "user.email", "thomas@example.invalid");
  git("config", "core.autocrlf", "false");
  git("add", "-A");
  git("commit", "--quiet", "-m", "the scratch brain");
  git("remote", "add", "origin", bare);
  git("push", "--quiet", "-u", "origin", "main");

  execFileSync("git", ["clone", "--quiet", bare, claire]);
  const hers = gitIn(claire);
  hers("config", "user.name", CLAIRE);
  hers("config", "user.email", "claire@example.invalid");
  hers("config", "core.autocrlf", "false");
}

function writeNote(brain, rel, content) {
  const abs = join(brain, "vault", rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

const readNote = (brain, rel) => readFileSync(join(brain, "vault", rel), "utf8");

function commitAndPush(brain, message) {
  const git = gitIn(brain);
  git("add", "-A");
  git("commit", "--quiet", "-m", message);
  git("pull", "--quiet", "--rebase");
  git("push", "--quiet");
}

// ─────────────────────────────────────────────────────────────────────────────
buildScratchBrain();

console.log("\n── 1. Thomas meets a mail neither brain has seen ──");
{
  const answer = run(thomas, "known-source.mjs", AS_THOMAS_SEES_IT);
  claim("a fresh source answers 'not held', exit 0", answer.status === 0 && /not held/.test(answer.out), answer.out + answer.err);

  // The key is taken from the tool's own answer rather than recomposed here: what the
  // capture stores must be what the check would have looked for, and a key computed a
  // second way in this file would agree with itself instead of with the product.
  const key = answer.out.match(/(mail\|\S+)/)?.[1] ?? "";
  console.log(`  · the key both machines must agree on: ${key}`);

  writeNote(
    thomas,
    `raw-sources/${DAY}-invoice.md`,
    `---\ntype: raw\ncreated: ${DAY}\nupdated: ${DAY}\ntags: [invoice]\nsources: [${key}]\n---\n\n# The invoice mail\n\nAmount, due date, the lot.\n`,
  );
  commitAndPush(thomas, "capture: the invoice mail");
}

console.log("\n── 2. Claire pulls, then meets the SAME mail through her own connector ──");
{
  gitIn(claire)("pull", "--quiet", "--rebase");
  const answer = run(claire, "known-source.mjs", AS_CLAIRE_SEES_IT);

  // 🎯 THE WHOLE FEATURE. Different spelling, different timezone, different case, a git
  // merge in between — one key.
  claim("exit 1: already held, from raw fields spelled differently", answer.status === 1, `exit ${answer.status}\n${answer.out}${answer.err}`);
  claim("it names the note to go and read", answer.out.includes(`vault/raw-sources/${DAY}-invoice.md`), answer.out);
  claim("it says READ and ENRICH, never discard", /Read that note and enrich it/.test(answer.out), answer.out);
}

console.log("\n── 3. The deterministic writer refuses it too, not just the check ──");
{
  // A model that ignores the check must still not be able to store the duplicate: the
  // guard sits in the writer, where the loss would actually happen.
  const spec = {
    type: "topic",
    title: "The invoice mail",
    tags: ["invoice"],
    body: "Same mail, second brain.",
    // The homonym, deliberately exercised: a filing spec's own `sources` are TIERS of
    // material, and the machine identity travels as `sourceKeys`. The two never meet.
    sources: [{ tier: "verbatim", ref: `the invoice mail, ${DAY}` }],
    sourceKeys: [{ type: "mail", from: "billing@example.com", date: "2026-09-03T09:14:00Z", subject: "Votre facture est prête" }],
  };
  const done = spawnSync(process.execPath, [join("scripts", "file-back-note.mjs")], {
    cwd: claire,
    encoding: "utf8",
    input: JSON.stringify(spec),
  });
  const said = (done.stdout ?? "") + (done.stderr ?? "");
  claim("file-back-note refuses to write the duplicate", done.status !== 0, said);
  claim("the refusal names the note that already holds it", said.includes(`raw-sources/${DAY}-invoice.md`), said);
}

console.log("\n── 4. An unrelated source still goes through ──");
{
  const answer = run(claire, "known-source.mjs", ["--type", "slack", "--channel", "C0CEQ4R5E", "--ts", "1725283200.001200"]);
  claim("a source nobody holds answers 'not held', exit 0", answer.status === 0 && /not held/.test(answer.out), answer.out + answer.err);
}

console.log("\n── 5. Both write on the same day ──");
{
  const before = run(claire, "dated-note-path.mjs", ["--folder", "daily", "--date", DAY]);
  claim("with nothing written yet, the shared name is offered", before.out.includes(`path: vault/daily/${DAY}.md`), before.out + before.err);

  // ⚠️ The `author:` stamp is what makes tomorrow's resolution work, and the tool says so
  // in its own output. A daily note that claims nobody falls back to the shared file.
  writeNote(thomas, `daily/${DAY}.md`, `---\nauthor: ${THOMAS}\n---\n\n# Monday\n\n- TP: signed the lease\n`);
  commitAndPush(thomas, "daily, Thomas");
  gitIn(claire)("pull", "--quiet", "--rebase");

  const after = run(claire, "dated-note-path.mjs", ["--folder", "daily", "--date", DAY]);
  claim("Claire is given a file of her own, not Thomas's", after.out.includes(`path: vault/daily/${DAY}-claire-dubois.md`), after.out + after.err);
  claim("and told whose note the base name already is", after.out.includes(THOMAS), after.out);
}

console.log("\n── 6. What merges on its own, and what stops and asks ──");
{
  writeNote(claire, `daily/${DAY}.md`, `---\nauthor: ${THOMAS}\n---\n\n# Monday\n\n- CL: the notary answered\n`);
  gitIn(claire)("add", "-A");
  gitIn(claire)("commit", "--quiet", "-m", "daily, Claire (the same file, on purpose)");

  writeNote(thomas, `daily/${DAY}.md`, `---\nauthor: ${THOMAS}\n---\n\n# Monday\n\n- TP: signed the lease\n- TP: and called the bank\n`);
  commitAndPush(thomas, "daily, Thomas again");

  let rebased = true;
  try {
    gitIn(claire)("pull", "--quiet", "--rebase");
  } catch {
    rebased = false;
  }
  claim("two appends to one daily note rebase with no human", rebased);
  const merged = rebased ? readNote(claire, `daily/${DAY}.md`) : "";
  claim("both sides' lines survived", /notary/.test(merged) && /called the bank/.test(merged), merged);
  if (rebased) gitIn(claire)("push", "--quiet");

  // The negative pole, and the reason the merge rule was narrowed.
  const card = (updated, body) =>
    `---\ntype: person\ncreated: ${DAY}\nupdated: ${updated}\ntags: [billing]\n---\n\n# Amina Haddad\n\n${body}\n`;
  writeNote(thomas, "people/amina-haddad.md", card(DAY, "Runs billing."));
  commitAndPush(thomas, "a person card");
  gitIn(claire)("pull", "--quiet", "--rebase");

  writeNote(claire, "people/amina-haddad.md", card("2026-09-04", "Runs billing AND procurement."));
  gitIn(claire)("add", "-A");
  gitIn(claire)("commit", "--quiet", "-m", "Claire edits the card");
  writeNote(thomas, "people/amina-haddad.md", card("2026-09-05", "Moved to the Lyon office."));
  commitAndPush(thomas, "Thomas edits the card");

  let stopped = false;
  try {
    gitIn(claire)("pull", "--quiet", "--rebase");
  } catch {
    stopped = true;
  }
  claim("two edits to one person card STOP and ask", stopped);
  if (stopped) {
    // The very command `scripts/lib/remote-sync.mjs` runs before it aborts.
    const named = gitIn(claire)("diff", "--name-only", "--diff-filter=U");
    claim("the conflicting file is named, as the sync tick reads it", named.trim() === "vault/people/amina-haddad.md", named);
    gitIn(claire)("rebase", "--abort");
    const restored = readNote(claire, "people/amina-haddad.md");
    claim(
      "after the abort the card carries ONE updated: line, not two",
      restored.match(/^updated:/gm)?.length === 1,
      restored,
    );
    claim("and the tree is clean: nothing left for a human to tidy", gitIn(claire)("status", "--porcelain") === "");
  }
}

console.log(`\n═══ duo rehearsal: ${passed} held, ${failures.length} failed ═══`);
if (failures.length > 0) for (const f of failures) console.log(`  · ${f}`);
if (KEEP) console.log(`scratch brain kept at ${root}`);
else rmSync(root, { recursive: true, force: true });
process.exit(failures.length === 0 ? 0 : 1);
