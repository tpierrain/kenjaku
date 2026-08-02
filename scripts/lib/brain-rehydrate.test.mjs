// Rehydrating a brain on a SECOND machine (F14).
//
// `.mcp.json` and `.claude/settings.json` are gitignored on purpose — they bake an
// absolute path, so they cannot travel through git. Their `.template` siblings DO
// travel, so a fresh clone already holds everything needed to regenerate them: the
// only unknowns are the placeholders that describe THIS machine.
import test from "node:test";
import assert from "node:assert/strict";

import { machineReplacements } from "./brain-rehydrate.mjs";

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
