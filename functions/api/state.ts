import { authenticateAccessUser, type AccessEnv } from "../_shared/access";

interface Env extends AccessEnv {
  DB?: D1Database;
  FEEDS_WRITE_ENABLED?: string;
}

type StateRow = {
  item_id: string;
  read: number;
  saved: number;
  skipped: number;
  liked: number;
  saved_item_json: string | null;
  updated_at: string;
};

type StatePatch = Partial<{
  read: boolean;
  saved: boolean;
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

function parseSavedItem(value: string | null) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as { id?: unknown };
    return typeof parsed?.id === "string" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 503 });

  const auth = await authenticateAccessUser(request, env);
  if (!auth.ok) return auth.response;

  const result = await env.DB.prepare(
    `SELECT item_id, read, saved, skipped, liked, saved_item_json, updated_at
     FROM reading_state
     WHERE user_key = ?`
  )
    .bind(auth.userKey)
    .all<StateRow>();

  const states: Record<string, unknown> = {};
  const savedItems: Record<string, unknown> = {};

  for (const row of result.results ?? []) {
    states[row.item_id] = {
      read: Boolean(row.read),
      saved: Boolean(row.saved),
      skipped: Boolean(row.skipped),
      liked: Boolean(row.liked),
      updatedAt: row.updated_at
    };

    if (row.saved) {
      const savedItem = parseSavedItem(row.saved_item_json);
      if (savedItem) savedItems[row.item_id] = savedItem;
    }
  }

  return json({
    states,
    savedItems,
    syncAvailable: true,
    writeEnabled: canWrite(env)
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 503 });

  const auth = await authenticateAccessUser(request, env);
  if (!auth.ok) return auth.response;

  if (!canWrite(env)) {
    return json({ error: "Remote writes are disabled" }, { status: 403 });
  }

  const body = (await request.json()) as {
    itemId?: string;
    briefingDate?: string;
    patch?: StatePatch;
    itemSnapshot?: unknown;
  };

  if (!body.itemId || !body.patch || typeof body.patch !== "object") {
    return json({ error: "itemId and patch are required" }, { status: 400 });
  }

  const changedKeys = Object.keys(body.patch).filter(
    (key) => ["read", "saved", "skipped", "liked"].includes(key)
  ) as Array<keyof StatePatch>;

  if (!changedKeys.length) {
    return json({ error: "patch contains no supported state fields" }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    `SELECT item_id, read, saved, skipped, liked, saved_item_json, updated_at
     FROM reading_state
     WHERE user_key = ? AND item_id = ?`
  )
    .bind(auth.userKey, body.itemId)
    .first<StateRow>();

  const next = {
    read: body.patch.read ?? Boolean(existing?.read),
    saved: body.patch.saved ?? Boolean(existing?.saved),
    skipped: body.patch.skipped ?? Boolean(existing?.skipped),
    liked: body.patch.liked ?? Boolean(existing?.liked)
  };

  let savedItemJson = existing?.saved_item_json ?? null;
  if (next.saved && body.itemSnapshot && typeof body.itemSnapshot === "object") {
    const snapshot = body.itemSnapshot as { id?: unknown };
    if (snapshot.id !== body.itemId) {
      return json({ error: "itemSnapshot.id must match itemId" }, { status: 400 });
    }
    savedItemJson = JSON.stringify(body.itemSnapshot);
  }
  if (!next.saved) savedItemJson = null;

  const updatedAt = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO reading_state
        (user_key, item_id, read, saved, skipped, liked, saved_item_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_key, item_id) DO UPDATE SET
         read = excluded.read,
         saved = excluded.saved,
         skipped = excluded.skipped,
         liked = excluded.liked,
         saved_item_json = excluded.saved_item_json,
         updated_at = excluded.updated_at`
    ).bind(
      auth.userKey,
      body.itemId,
      next.read ? 1 : 0,
      next.saved ? 1 : 0,
      next.skipped ? 1 : 0,
      next.liked ? 1 : 0,
      savedItemJson,
      updatedAt
    )
  ];

  for (const key of changedKeys) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO reading_events
          (user_key, item_id, briefing_date, event_type, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        auth.userKey,
        body.itemId,
        body.briefingDate ?? null,
        body.patch[key] ? key : `un${key}`,
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
