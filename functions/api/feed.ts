interface Env {
  DB?: D1Database;
}

type BriefingRow = {
  date: string;
  timezone: string;
  generated_at: string;
};

type ItemRow = {
  id: string;
  kind: string;
  interest_id: string;
  title: string;
  blocks_json: string;
  selection_reason: string;
  creator: string | null;
  published_at: string | null;
  discovered_at: string;
  language: string | null;
  region: string | null;
  freshness: string;
  reliability: string;
  minutes: number | null;
  consumption_mode: string | null;
  tags_json: string;
  media_json: string | null;
  scores_json: string | null;
  rank: number;
  span: number | null;
};

type SourceRow = {
  item_id: string;
  source_id: string;
  name: string;
  source_url: string;
  role: string;
  published_at: string | null;
  date_label: string | null;
};

function json(value: unknown, init: ResponseInit = {}) {
  return Response.json(value, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers ?? {})
    }
  });
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) {
    return json({ error: "D1 binding DB is not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const requestedDate = url.searchParams.get("date");

  const briefing = requestedDate
    ? await env.DB.prepare(
        "SELECT date, timezone, generated_at FROM briefings WHERE date = ?"
      )
        .bind(requestedDate)
        .first<BriefingRow>()
    : await env.DB.prepare(
        "SELECT date, timezone, generated_at FROM briefings ORDER BY date DESC LIMIT 1"
      ).first<BriefingRow>();

  if (!briefing) {
    return json({ error: "No briefing found" }, { status: 404 });
  }

  const result = await env.DB.prepare(
    `SELECT
      i.id,
      i.kind,
      i.interest_id,
      i.title,
      i.blocks_json,
      i.selection_reason,
      i.creator,
      i.published_at,
      i.discovered_at,
      i.language,
      i.region,
      i.freshness,
      i.reliability,
      i.minutes,
      i.consumption_mode,
      i.tags_json,
      i.media_json,
      i.scores_json,
      r.rank,
      r.span
    FROM recommendations r
    JOIN items i ON i.id = r.item_id
    WHERE r.briefing_date = ?
    ORDER BY r.rank ASC`
  )
    .bind(briefing.date)
    .all<ItemRow>();

  const rows = result.results ?? [];
  const ids = rows.map((row) => row.id);
  const sourceMap = new Map<string, SourceRow[]>();

  if (ids.length) {
    const placeholders = ids.map(() => "?").join(",");
    const sourceResult = await env.DB.prepare(
      `SELECT
        x.item_id,
        x.source_id,
        s.name,
        x.source_url,
        x.role,
        x.published_at,
        x.date_label
      FROM item_sources x
      JOIN sources s ON s.id = x.source_id
      WHERE x.item_id IN (${placeholders})
      ORDER BY x.item_id, x.observed_at ASC`
    )
      .bind(...ids)
      .all<SourceRow>();

    for (const source of sourceResult.results ?? []) {
      const current = sourceMap.get(source.item_id) ?? [];
      current.push(source);
      sourceMap.set(source.item_id, current);
    }
  }

  return json({
    version: 1,
    date: briefing.date,
    timezone: briefing.timezone,
    generatedAt: briefing.generated_at,
    items: rows.map((row) => ({
      id: row.id,
      briefingDate: briefing.date,
      kind: row.kind,
      interestId: row.interest_id,
      title: row.title,
      blocks: parseJson(row.blocks_json, []),
      sources: (sourceMap.get(row.id) ?? []).map((source) => ({
        sourceId: source.source_id,
        name: source.name,
        url: source.source_url,
        role: source.role,
        publishedAt: source.published_at ?? undefined,
        dateLabel: source.date_label ?? undefined
      })),
      selectionReason: row.selection_reason,
      creator: row.creator ?? undefined,
      publishedAt: row.published_at ?? undefined,
      discoveredAt: row.discovered_at,
      language: row.language ?? undefined,
      region: row.region ?? undefined,
      freshness: row.freshness,
      reliability: row.reliability,
      minutes: row.minutes ?? undefined,
      consumptionMode: row.consumption_mode ?? undefined,
      span: row.span ?? undefined,
      tags: parseJson(row.tags_json, []),
      media: parseJson(row.media_json, undefined),
      scores: parseJson(row.scores_json, undefined)
    }))
  });
};
