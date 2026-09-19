interface Env {
  DB?: D1Database;
  FEEDS_WRITE_ENABLED?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return Response.json(
      { ok: false, d1: false, writeEnabled: false },
      { status: 503 }
    );
  }

  const result = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();

  return Response.json({
    ok: result?.ok === 1,
    d1: true,
    writeEnabled: env.FEEDS_WRITE_ENABLED === "1"
  });
};
