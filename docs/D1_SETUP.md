# D1 setup

The app is deliberately local-first. D1 is the durable sync and archive layer; the UI still works from the bundled daily snapshot if D1 is absent.

## 1. Create local Wrangler config

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

`wrangler.jsonc` is gitignored because the actual D1 database ID is deployment-specific.

## 2. Create the database

```bash
npm run db:create
```

Copy the returned database ID into `wrangler.jsonc`.

## 3. Apply schema

Local:

```bash
npm run db:migrate:local
```

Remote:

```bash
npm run db:migrate:remote
```

## 4. Import source pool

```bash
npm run sources:sql > .generated-sources.sql
npx wrangler d1 execute feeds-shijia --local --file=.generated-sources.sql
```

Use `--remote` after checking the generated SQL.

## 5. Import a daily snapshot

```bash
npm run briefing:sql -- content/briefings/2026-09-19.json > .generated-briefing.sql
npx wrangler d1 execute feeds-shijia --local --file=.generated-briefing.sql
```

Again, switch to `--remote` only after local verification.

## 6. Run Pages + Functions locally

```bash
npm run dev:pages
```

The relevant routes are:

- `GET /api/feed?date=YYYY-MM-DD`
- `GET /api/state?clientId=...`
- `POST /api/state`
- `POST /api/event`
- `GET /api/health`

## Remote writes are off by default

`FEEDS_WRITE_ENABLED=0` is intentional.

Do not set it to `1` on an unauthenticated public deployment. Protect the site/API with Cloudflare Access first, then enable writes.

The browser always writes to localStorage immediately. Remote writes are best-effort sync; if D1 is offline or disabled, the feed remains usable.

## Source of truth

- `config/sources.yaml`: source graph
- `content/briefings/*.json`: immutable daily snapshots
- D1: durable runtime copy, exposure history, reading state, feedback
