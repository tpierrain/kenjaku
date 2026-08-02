// Rehydrating a brain on a SECOND machine (F14).
//
// `.mcp.json` and `.claude/settings.json` are gitignored on purpose — they bake an
// absolute path, so they cannot travel through git. Their `.template` siblings DO
// travel, so a fresh clone already holds everything needed to regenerate them: the
// only unknowns are the placeholders that describe THIS machine.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { machineReplacements } from "./brain-rehydrate.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const installerSource = () => readFileSync(join(REPO_ROOT, "installer.mjs"), "utf8");

test("machineReplacements bakes the brain path into the machine-specific placeholders", () => {
  assert.deepEqual(
    machineReplacements({ brainDir: "/Users/ada/mind-palace", platform: "darwin", tmpDir: "/tmp" }),
    {
      "{{PROJECT_ROOT}}": "/Users/ada/mind-palace",
      "{{NODE}}": '/bin/sh \\"/Users/ada/mind-palace/scripts/run-node.sh\\"',
      "{{TMP_DIR}}": "/tmp",
    },
  );
});

// Fed with the OTHER platform's data on purpose: on a posix CI, a windows branch
// left inlined is indistinguishable from the identity, and the regression only
// ever shows up on a user's machine.
test("machineReplacements resolves the windows hook runner, on a posix-normalised path", () => {
  assert.deepEqual(
    machineReplacements({
      brainDir: "C:\\Users\\ada\\mind-palace",
      platform: "win32",
      tmpDir: "C:\\Temp",
    }),
    {
      "{{PROJECT_ROOT}}": "C:/Users/ada/mind-palace",
      "{{NODE}}": "C:/Users/ada/mind-palace/scripts/run-node.cmd",
      "{{TMP_DIR}}": "C:/Temp",
    },
  );
});

// Two generators that substitute differently produce two different brains: a brain
// installed here would not match the same brain rehydrated there. So the installer
// must DELEGATE the machine placeholders, never re-declare them.
test("the installer takes its machine placeholders from here, and declares none of its own", () => {
  const source = installerSource();
  assert.match(source, /import \{[^}]*machineReplacements[^}]*\} from "\.\/scripts\/lib\/brain-rehydrate\.mjs"/);
  assert.deepEqual(
    ["{{PROJECT_ROOT}}", "{{NODE}}", "{{TMP_DIR}}"].filter((k) => source.includes(`"${k}":`)),
    [],
  );
});

test("the installer still declares the OWNER placeholders itself (positive control)", () => {
  // Proves the guard above reads the right file and would notice an inline
  // declaration: these three are legitimately installer-only — they describe the
  // person, get baked into files that DO survive a clone, so a rehydrate never
  // needs them.
  const source = installerSource();
  assert.deepEqual(
    ["{{PROJECT_NAME}}", "{{OWNER_NAME}}", "{{LANGUAGE}}"].filter((k) => source.includes(`"${k}":`)),
    ["{{PROJECT_NAME}}", "{{OWNER_NAME}}", "{{LANGUAGE}}"],
  );
});
