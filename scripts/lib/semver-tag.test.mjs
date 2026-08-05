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
  assert.ok(compareSemverTags(v("v5.0.0"), v("v4.99.99")) > 0, "major outranks minor and patch");
});
