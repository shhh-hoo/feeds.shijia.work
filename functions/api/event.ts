interface Env {
  DB?: D1Database;
  FEEDS_WRITE_ENABLED?: string;
}

const allowedEvents = new Set([
  "discovered",
  "considered",
  "selected",
  "shown",
  "opened",
  "saved",
  "unsaved",
  "consumed",
  "unconsumed",
  "skipped",
  "unskipped",
  "liked",
  "unliked"
]);

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
  if (env.FEEDS_WRITE_ENABLED !== "1") {
    return json(
      { error: "Remote writes are disabled. Enable only behind an authenticated Cloudflare Access boundary." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    clientId?: string;
    itemId?: string;
    briefingDate?: string;
    eventType?: string;
    metadata?: unknown;
  };

  if (!body.clientId || !body.itemId || !body.eventType) {
    return json({ error: "clientId, itemId and eventType are required" }, { status: 400 });
  }
  if (!allowedEvents.has(body.eventType)) {
    return json({ error: "Unsupported eventType" }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO exposures
      (item_id, briefing_date, event_type, client_id, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      body.itemId,
      body.briefingDate ?? null,
      body.eventType,
      body.clientId,
      body.metadata == null ? null : JSON.stringify(body.metadata),
      new Date().toISOString()
    )
    .run();

  return json({ ok: true });
};
