import { test } from "node:test";
import assert from "node:assert/strict";
import { compareSemverTags, parseSemverTag, pickLatestSemverTag } from "./semver-tag.mjs";

test("pickLatestSemverTag: picks the highest of several v-prefixed tags", () => {
  assert.equal(pickLatestSemverTag(["v1.0.0", "v1.2.0", "v1.1.0"]), "v1.2.0");
});

test("pickLatestSemverTag: compares numerically, not lexically (v3.10.0 > v3.2.0)", () => {
  assert.equal(pickLatestSemverTag(["v3.2.0", "v3.10.0"]), "v3.10.0");
});

test("pickLatestSemverTag: ignores non-semver refs (branches, junk)", () => {
  assert.equal(pickLatestSemverTag(["main", "v1.0.0", "garbage", "v0.9.0"]), "v1.0.0");
});

test("pickLatestSemverTag: ignores pre-releases (no release channel yet)", () => {
  assert.equal(pickLatestSemverTag(["v1.0.0", "v1.1.0-beta", "v2.0.0-rc.1"]), "v1.0.0");
});

test("pickLatestSemverTag: no semver tag at all → null", () => {
  assert.equal(pickLatestSemverTag(["main", "dev"]), null);
  assert.equal(pickLatestSemverTag([]), null);
  assert.equal(pickLatestSemverTag(undefined), null);
});

test("pickLatestSemverTag: returns the ORIGINAL tag string (preserves the v prefix as found)", () => {
  // A brain records exactly what GitHub is tagged with → keep the literal.
  assert.equal(pickLatestSemverTag(["1.0.0", "v1.1.0"]), "v1.1.0");
});

test("compareSemverTags: orders numerically, and reports equality — v3.10.0 outranks v3.2.0", () => {
  const v = (t) => parseSemverTag(t);
  assert.ok(compareSemverTags(v("v3.10.0"), v("v3.2.0")) > 0, "3.10.0 is newer than 3.2.0");
  assert.ok(compareSemverTags(v("v3.2.0"), v("v3.10.0")) < 0, "and the comparison is symmetric");
  assert.equal(compareSemverTags(v("v4.7.0"), v("v4.7.0")), 0, "the same release ranks equal");
  assert.ok(compareSemverTags(v("v4.7.1"), v("v4.7.0")) > 0, "a patch still advances a brain");
  // …and symmetric on the patch too. Read one way only, an ordering that ADDS the
  // two patches instead of subtracting them passes: 1 + 0 is positive, just like
  // 1 - 0. The other direction is where the two part company, and it is the
  // direction that matters — it decides whether a brain is told it is behind.
  assert.ok(compareSemverTags(v("v4.7.0"), v("v4.7.1")) < 0, "and older reads as older");
  assert.ok(compareSemverTags(v("v5.0.0"), v("v4.99.99")) > 0, "major outranks minor and patch");
});

test("parseSemverTag: the tag IS the whole ref — a version buried in a longer name is not one", () => {
  // `git ls-remote --tags` hands back every tag a repo carries, ours and anyone
  // else's. Matched loosely, `release-v1.2.3` or `backup/v1.2.3` would be read as
  // an engine release, and a brain would be offered an update to something that is
  // not one.
  assert.equal(parseSemverTag("release-v1.2.3"), null);
  assert.equal(parseSemverTag("v1.2.3-hotfix"), null);
  assert.deepEqual(parseSemverTag("v1.2.3"), { major: 1, minor: 2, patch: 3 });
});

test("parseSemverTag: the `v` is optional, and a two-digit part is one number", () => {
  // Both spellings exist in the wild and this repo has been tagged `vX.Y.Z` from
  // the start — but nothing forces the next release to be. Read as a single digit,
  // `v10.0.0` would parse as nothing at all: the day the majors reach double
  // figures, every brain would go quiet about updates rather than say why.
  assert.deepEqual(parseSemverTag("1.2.3"), { major: 1, minor: 2, patch: 3 });
  assert.deepEqual(parseSemverTag("v10.20.30"), { major: 10, minor: 20, patch: 30 });
});

test("parseSemverTag: nothing at all is not a version", () => {
  // The caller reads tags off a network answer, so `undefined` is a real input.
  assert.equal(parseSemverTag(undefined), null);
  assert.equal(parseSemverTag(null), null);
  assert.equal(parseSemverTag(""), null);
});

test("pickLatestSemverTag: a tie keeps the FIRST spelling seen, and never re-picks an equal", () => {
  // A repo can carry `1.0.0` and `v1.0.0` for the same release. They rank equal, so
  // "higher" must mean strictly higher: a `>=` would make every equal tag replace
  // the last one, and the version this brain reports would depend on the order the
  // remote happened to list its refs in.
  assert.equal(pickLatestSemverTag(["v1.0.0", "1.0.0"]), "v1.0.0");
  assert.equal(pickLatestSemverTag(["1.0.0", "v1.0.0"]), "1.0.0");
});
