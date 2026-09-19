import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PRESENTATION_MODES, validateIssue } from "./issue-schema.mjs";

const fixture = JSON.parse(fs.readFileSync("content/issues/2026-09-19.json", "utf8"));
const clone = () => structuredClone(fixture);
const allItems = (issue) => issue.contents.flatMap((section) => section.items);

function expectInvalid(mutator, pattern) {
  const issue = clone();
  mutator(issue);
  const errors = validateIssue(issue);
  assert.ok(errors.some((error) => pattern.test(error)), `Expected ${pattern}, got:\n${errors.join("\n")}`);
}

test("valid heterogeneous Daily Issue v2 fixture passes", () => {
  assert.deepEqual(validateIssue(fixture), []);
  const modes = new Set(allItems(fixture).map((item) => item.presentation.mode));
  assert.ok(modes.size >= 5, "fixture should exercise heterogeneous presentation intent");
  for (const mode of modes) assert.ok(PRESENTATION_MODES.includes(mode));
});

test("malformed Issue identity/date/timezone fails", () => {
  expectInvalid((issue) => {
    issue.id = "wrong";
    issue.date = "2026-02-31";
    issue.timezone = "Mars/Olympus";
  }, /(id:|date:|timezone:)/);
});

test("duplicate Item IDs fail across editorial modes", () => {
  expectInvalid((issue) => {
    issue.contents[1].items[0].id = issue.contents[0].items[0].id;
  }, /duplicate Item id/);
});

test("bad source references fail", () => {
  expectInvalid((issue) => {
    issue.contents[0].items[0].provenance.assertions[0].sourceRefs = ["missing-source"];
  }, /unknown source reference/);
});

test("empty editorial mode section is valid; there is no publication quota", () => {
  const issue = clone();
  issue.contents[1].items = [];
  assert.deepEqual(validateIssue(issue), []);
});

test("duplicate editorial mode sections fail", () => {
  expectInvalid((issue) => {
    issue.contents[1].mode = "current";
  }, /duplicate editorial mode|missing editorial mode/);
});

test("invalid editorial mode fails", () => {
  expectInvalid((issue) => {
    issue.contents[0].mode = "breaking";
  }, /unsupported editorial mode/);
});

test("invalid presentation mode fails", () => {
  expectInvalid((issue) => {
    issue.contents[0].items[0].presentation.mode = "hero-card";
  }, /unsupported presentation mode/);
});

test("empty publishable Item fails", () => {
  expectInvalid((issue) => {
    const editorial = issue.contents[1].items[0].editorial;
    delete editorial.lede;
    delete editorial.body;
    delete editorial.entryPoint;
    delete editorial.structured;
  }, /no publishable content/);
});

test("future-dated Current source fails deterministically", () => {
  expectInvalid((issue) => {
    issue.contents[0].items[0].provenance.sources[0].publishedAt = "2026-09-20";
  }, /cannot be after Issue date/);
});

test("invalid cross-Item reference fails", () => {
  expectInvalid((issue) => {
    issue.contents[1].items[0].metadata.relatedItemRefs = ["does-not-exist"];
  }, /unknown Item reference/);
});

test("canonical Issue is reconstructable from the GitHub artifact alone", () => {
  const issue = JSON.parse(fs.readFileSync("content/issues/2026-09-19.json", "utf8"));
  assert.equal(issue.id, "issue-2026-09-19");
  assert.equal(issue.contents.length, 2);
  assert.ok(allItems(issue).length >= 5);
  for (const item of allItems(issue)) {
    assert.equal(typeof item.editorial.title, "string");
    assert.ok(Array.isArray(item.provenance.sources));
  }
});
