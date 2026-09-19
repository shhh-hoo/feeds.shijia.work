import fs from "node:fs";
import path from "node:path";

const dir = "content/briefings";
const files = fs.readdirSync(dir).filter((name) => name.endsWith(".json"));
const errors = [];

for (const file of files) {
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));

  if (data.version !== 1) errors.push(`${file}: version must be 1`);
  for (const key of ["date", "timezone", "generatedAt", "items"]) {
    if (data[key] == null) errors.push(`${file}: missing ${key}`);
  }
  if (!Array.isArray(data.items)) {
    errors.push(`${file}: items must be an array`);
    continue;
  }

  const ids = new Set();
  for (const [index, item] of data.items.entries()) {
    const at = `${file}:items[${index}]`;
    for (const key of [
      "id",
      "briefingDate",
      "kind",
      "interestId",
      "title",
      "blocks",
      "sources",
      "selectionReason",
      "discoveredAt",
      "freshness",
      "reliability",
      "tags"
    ]) {
      if (item[key] == null) errors.push(`${at}: missing ${key}`);
    }

    if (ids.has(item.id)) errors.push(`${at}: duplicate id ${item.id}`);
    ids.add(item.id);

    if (!Array.isArray(item.blocks) || item.blocks.length === 0) {
      errors.push(`${at}: blocks must be non-empty`);
    }
    if (!Array.isArray(item.sources) || item.sources.length === 0) {
      errors.push(`${at}: sources must be non-empty`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`validated ${files.length} briefing snapshots`);
