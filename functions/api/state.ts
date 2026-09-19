interface Env {
  DB?: D1Database;
  FEEDS_WRITE_ENABLED?: string;
}

type StateRow = {
  item_id: string;
  saved: number;
  consumed: number;
  skipped: number;
  liked: number;
  updated_at: string;
};

type StatePatch = Partial<{
  saved: boolean;
  consumed: boolean;
  skipped: boolean;
  liked: boolean;
}>;

function json(value: unknown, init: ResponseInit = {}) {
  return Response.json(value, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers ?? {})
    }
  });
}

function canWrite(env: Env) {
  return env.FEEDS_WRITE_ENABLED === "1";
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 503 });

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");
  if (!clientId) return json({ error: "clientId is required" }, { status: 400 });

  const result = await env.DB.prepare(
    `SELECT item_id, saved, consumed, skipped, liked, updated_at
     FROM item_state
     WHERE client_id = ?`
  )
    .bind(clientId)
    .all<StateRow>();

  const states = Object.fromEntries(
    (result.results ?? []).map((row) => [
      row.item_id,
      {
        saved: Boolean(row.saved),
        consumed: Boolean(row.consumed),
        skipped: Boolean(row.skipped),
        liked: Boolean(row.liked),
        updatedAt: row.updated_at
      }
    ])
  );

  return json({ clientId, states, writeEnabled: canWrite(env) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 503 });
  if (!canWrite(env)) {
    return json(
      { error: "Remote writes are disabled. Enable only behind an authenticated Cloudflare Access boundary." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    clientId?: string;
    itemId?: string;
    briefingDate?: string;
    patch?: StatePatch;
  };

  if (!body.clientId || !body.itemId || !body.patch || typeof body.patch !== "object") {
    return json({ error: "clientId, itemId and patch are required" }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    "SELECT item_id, saved, consumed, skipped, liked, updated_at FROM item_state WHERE client_id = ? AND item_id = ?"
  )
    .bind(body.clientId, body.itemId)
    .first<StateRow>();

  const next = {
    saved: body.patch.saved ?? Boolean(existing?.saved),
    consumed: body.patch.consumed ?? Boolean(existing?.consumed),
    skipped: body.patch.skipped ?? Boolean(existing?.skipped),
    liked: body.patch.liked ?? Boolean(existing?.liked)
  };

  const updatedAt = new Date().toISOString();
  const changedKeys = Object.keys(body.patch).filter(
    (key) => ["saved", "consumed", "skipped", "liked"].includes(key)
  );

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO item_state
        (client_id, item_id, saved, consumed, skipped, liked, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(client_id, item_id) DO UPDATE SET
         saved = excluded.saved,
         consumed = excluded.consumed,
         skipped = excluded.skipped,
         liked = excluded.liked,
         updated_at = excluded.updated_at`
    ).bind(
      body.clientId,
      body.itemId,
      next.saved ? 1 : 0,
      next.consumed ? 1 : 0,
      next.skipped ? 1 : 0,
      next.liked ? 1 : 0,
      updatedAt
    )
  ];

  for (const key of changedKeys) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO exposures
          (item_id, briefing_date, event_type, client_id, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        body.itemId,
        body.briefingDate ?? null,
        body.patch[key as keyof StatePatch] ? key : `un${key}`,
        body.clientId,
        JSON.stringify({ patch: body.patch }),
        updatedAt
      )
    );
  }

  await env.DB.batch(statements);

  return json({
    itemId: body.itemId,
    state: { ...next, updatedAt }
  });
};
