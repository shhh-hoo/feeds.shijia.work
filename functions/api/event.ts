import { authenticateAccessUser, type AccessEnv } from "../_shared/access";

interface Env extends AccessEnv {
  DB?: D1Database;
  FEEDS_WRITE_ENABLED?: string;
}

const allowedEvents = new Set(["shown", "opened"]);

function json(value: unknown, init: ResponseInit = {}) {
  return Response.json(value, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers ?? {})
    }
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 503 });

  const auth = await authenticateAccessUser(request, env);
  if (!auth.ok) return auth.response;

  if (env.FEEDS_WRITE_ENABLED !== "1") {
    return json({ error: "Remote writes are disabled" }, { status: 403 });
  }

  const body = (await request.json()) as {
    itemId?: string;
    briefingDate?: string;
    eventType?: string;
    metadata?: unknown;
  };

  if (!body.itemId || !body.eventType) {
    return json({ error: "itemId and eventType are required" }, { status: 400 });
  }
  if (!allowedEvents.has(body.eventType)) {
    return json({ error: "Unsupported eventType" }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO reading_events
      (user_key, item_id, briefing_date, event_type, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      auth.userKey,
      body.itemId,
      body.briefingDate ?? null,
      body.eventType,
      body.metadata == null ? null : JSON.stringify(body.metadata),
      new Date().toISOString()
    )
    .run();

  return json({ ok: true });
};
