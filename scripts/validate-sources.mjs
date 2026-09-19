import fs from "node:fs";
import YAML from "yaml";

const file = fs.readFileSync("config/sources.yaml", "utf8");
const parsed = YAML.parse(file);
const sources = parsed?.sources ?? [];

const ids = new Set();
const urls = new Set();
const errors = [];

for (const [index, source] of sources.entries()) {
  const at = `sources[${index}]`;
  for (const key of ["id", "name", "url", "interests", "modes", "type"]) {
    if (source[key] == null) errors.push(`${at}: missing ${key}`);
  }
  if (ids.has(source.id)) errors.push(`${at}: duplicate id ${source.id}`);
  ids.add(source.id);
  if (urls.has(source.url)) errors.push(`${at}: duplicate url ${source.url}`);
  urls.add(source.url);

  for (const score of ["authority", "taste_fit", "signal_density", "commercial_bias"]) {
    if (!Number.isFinite(source[score]) || source[score] < 1 || source[score] > 5) {
      errors.push(`${at}: ${score} must be 1-5`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`validated ${sources.length} sources`);
