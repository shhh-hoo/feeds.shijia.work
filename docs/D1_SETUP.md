# D1 setup

D1 is used for **cross-device reading state**, not for content generation.

The daily feed remains GitHub/Scheduled-Work owned. The browser remains local-first so reading state works even during a network or sync failure.

## 1. Create local Wrangler config

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

`wrangler.jsonc` is gitignored because the actual D1 database ID and Access configuration are deployment-specific.

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

The cross-device tables are created by `0002_cross_device_reading_state.sql`.

## 4. Configure Cloudflare Access

Create a self-hosted Access application for the deployed feed and restrict it to the intended identity.

Set:

- `TEAM_DOMAIN=https://<team>.cloudflareaccess.com`
- `POLICY_AUD=<Access Application AUD tag>`

The API verifies the signed `Cf-Access-Jwt-Assertion`; it does not trust a user-supplied email or browser-generated client ID.

## 5. Enable writes only after authentication works

Start with:

```text
FEEDS_WRITE_ENABLED=0
```

Verify `GET /api/state` while signed in through Access. Then switch to:

```text
FEEDS_WRITE_ENABLED=1
```

and redeploy.

## 6. Run Pages + Functions locally

```bash
npm run dev:pages
```

Local development without an Access JWT will intentionally fall back to local-only state unless you provide a valid Access-protected environment.

## Routes

- `GET /api/feed?date=YYYY-MM-DD`
- `GET /api/state`
- `POST /api/state`
- `POST /api/event`
- `GET /api/health`

## Source of truth

- GitHub briefing JSON: content
- browser localStorage: immediate/offline state
- D1 `reading_state`: cross-device state
- D1 saved snapshot: only enough content to render Saved across devices
- D1 `reading_events`: lightweight interaction history
