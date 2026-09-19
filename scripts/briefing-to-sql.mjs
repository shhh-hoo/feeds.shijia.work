import fs from "node:fs";

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/briefing-to-sql.mjs <snapshot.json>");
  process.exit(1);
}

const feed = JSON.parse(fs.readFileSync(input, "utf8"));

const q = (value) => {
  if (value == null) return "NULL";
  return "'" + String(value).replaceAll("'", "''") + "'";
};

const json = (value) => q(JSON.stringify(value ?? null));

console.log("BEGIN TRANSACTION;");
console.log(
  `INSERT INTO briefings (date, timezone, generated_at) VALUES (${q(feed.date)}, ${q(feed.timezone)}, ${q(feed.generatedAt)}) ` +
    `ON CONFLICT(date) DO UPDATE SET timezone=excluded.timezone, generated_at=excluded.generated_at;`
);

for (const [index, item] of feed.items.entries()) {
  const primaryUrl = item.sources?.[0]?.url ?? null;

  console.log(
    `INSERT INTO items (` +
      `id, canonical_url, kind, interest_id, title, blocks_json, selection_reason, creator, published_at, discovered_at, ` +
      `language, region, freshness, reliability, minutes, consumption_mode, tags_json, media_json, scores_json` +
    `) VALUES (` +
      [
        q(item.id),
        q(primaryUrl),
        q(item.kind),
        q(item.interestId),
        q(item.title),
        json(item.blocks),
        q(item.selectionReason),
        q(item.creator),
        q(item.publishedAt),
        q(item.discoveredAt),
        q(item.language),
        q(item.region),
        q(item.freshness),
        q(item.reliability),
        item.minutes == null ? "NULL" : Number(item.minutes),
        q(item.consumptionMode),
        json(item.tags ?? []),
        item.media == null ? "NULL" : json(item.media),
        item.scores == null ? "NULL" : json(item.scores)
      ].join(", ") +
    `) ON CONFLICT(id) DO UPDATE SET ` +
      `canonical_url=excluded.canonical_url, kind=excluded.kind, interest_id=excluded.interest_id, title=excluded.title, ` +
      `blocks_json=excluded.blocks_json, selection_reason=excluded.selection_reason, creator=excluded.creator, ` +
      `published_at=excluded.published_at, discovered_at=excluded.discovered_at, language=excluded.language, ` +
      `region=excluded.region, freshness=excluded.freshness, reliability=excluded.reliability, minutes=excluded.minutes, ` +
      `consumption_mode=excluded.consumption_mode, tags_json=excluded.tags_json, media_json=excluded.media_json, ` +
      `scores_json=excluded.scores_json, updated_at=CURRENT_TIMESTAMP;`
  );

  for (const source of item.sources ?? []) {
    console.log(
      `INSERT INTO item_sources (item_id, source_id, source_url, role, published_at, date_label) VALUES (` +
        [
          q(item.id),
          q(source.sourceId),
          q(source.url),
          q(source.role),
          q(source.publishedAt),
          q(source.dateLabel)
        ].join(", ") +
      `) ON CONFLICT(item_id, source_id, source_url) DO UPDATE SET ` +
        `role=excluded.role, published_at=excluded.published_at, date_label=excluded.date_label, observed_at=CURRENT_TIMESTAMP;`
    );
  }

  console.log(
    `INSERT INTO recommendations (` +
      `briefing_date, item_id, rank, reason, card_type, priority, consumption_mode, estimated_minutes, span` +
    `) VALUES (` +
      [
        q(feed.date),
        q(item.id),
        index + 1,
        q(item.selectionReason),
        q(item.kind),
        Math.round((item.scores?.final ?? 0) * 100),
        q(item.consumptionMode),
        item.minutes == null ? "NULL" : Number(item.minutes),
        item.span == null ? "NULL" : Number(item.span)
      ].join(", ") +
    `) ON CONFLICT(briefing_date, item_id) DO UPDATE SET ` +
      `rank=excluded.rank, reason=excluded.reason, card_type=excluded.card_type, priority=excluded.priority, ` +
      `consumption_mode=excluded.consumption_mode, estimated_minutes=excluded.estimated_minutes, span=excluded.span, ` +
      `selected_at=CURRENT_TIMESTAMP;`
  );
}

console.log("COMMIT;");
