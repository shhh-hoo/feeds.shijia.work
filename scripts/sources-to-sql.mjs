import fs from "node:fs";
import YAML from "yaml";

const parsed = YAML.parse(fs.readFileSync("config/sources.yaml", "utf8"));
const sources = parsed?.sources ?? [];

const q = (value) => {
  if (value == null) return "NULL";
  return "'" + String(value).replaceAll("'", "''") + "'";
};

for (const source of sources) {
  const columns = [
    "id",
    "name",
    "canonical_url",
    "source_type",
    "interests_json",
    "modes_json",
    "cadence",
    "language",
    "region",
    "authority",
    "taste_fit",
    "signal_density",
    "commercial_bias"
  ];
  const values = [
    q(source.id),
    q(source.name),
    q(source.url),
    q(source.type),
    q(JSON.stringify(source.interests ?? [])),
    q(JSON.stringify(source.modes ?? [])),
    q(source.cadence),
    q(source.language),
    q(source.region),
    Number(source.authority ?? 3),
    Number(source.taste_fit ?? 3),
    Number(source.signal_density ?? 3),
    Number(source.commercial_bias ?? 3)
  ];

  console.log(
    `INSERT INTO sources (${columns.join(", ")}) VALUES (${values.join(", ")}) ` +
      `ON CONFLICT(id) DO UPDATE SET ` +
      `name=excluded.name, canonical_url=excluded.canonical_url, source_type=excluded.source_type, ` +
      `interests_json=excluded.interests_json, modes_json=excluded.modes_json, cadence=excluded.cadence, ` +
      `language=excluded.language, region=excluded.region, authority=excluded.authority, taste_fit=excluded.taste_fit, ` +
      `signal_density=excluded.signal_density, commercial_bias=excluded.commercial_bias, updated_at=CURRENT_TIMESTAMP;`
  );
}
