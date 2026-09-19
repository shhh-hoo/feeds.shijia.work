import fs from "node:fs";
import path from "node:path";
import { validateIssue } from "./issue-schema.mjs";

const dir = "content/issues";
const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()
  : [];
const errors = [];

if (files.length === 0) {
  errors.push(`${dir}: no canonical Daily Issue JSON files found`);
}

for (const file of files) {
  const full = path.join(dir, file);
  let issue;
  try {
    issue = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (error) {
    errors.push(`${file}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    continue;
  }

  if (issue?.date && file !== `${issue.date}.json`) {
    errors.push(`${file}: canonical filename must match Issue date (${issue.date}.json)`);
  }

  for (const error of validateIssue(issue)) {
    errors.push(`${file}: ${error}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`validated ${files.length} Daily Issue v2 artifact${files.length === 1 ? "" : "s"}`);
