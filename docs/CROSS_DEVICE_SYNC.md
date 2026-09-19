# Cross-device reading state

Content stays in GitHub. D1 stores only personal interaction state and lightweight snapshots for saved items.

## State model

Per authenticated user and item:

- read
- saved
- liked
- skipped
- updated_at
- saved_item_json only while saved

The user's email is **not** stored in D1. The API validates the Cloudflare Access JWT and hashes the normalized email with SHA-256 to derive a stable `user_key`.

## Why saved items include a snapshot

The phone may save an item from an older briefing that the laptop has not loaded today. A saved snapshot lets the Saved view render that item cross-device without copying the entire feed archive into D1.

Unsaved feed content remains GitHub-owned.

## Cloudflare setup

1. Create/bind the D1 database as documented in `D1_SETUP.md`.
2. Apply migrations, including `0002_cross_device_reading_state.sql`.
3. Create a Cloudflare Access self-hosted application for `feeds.shijia.work/*`.
4. Add an Allow policy containing only the identity/identities that should access the personal feed.
5. Copy the Access Application Audience (AUD) tag to `POLICY_AUD`.
6. Set `TEAM_DOMAIN` to `https://<team>.cloudflareaccess.com`.
7. Keep `FEEDS_WRITE_ENABLED=0` while verifying authentication and D1 reads.
8. After `GET /api/state` succeeds through Access, set `FEEDS_WRITE_ENABLED=1` and redeploy.

Cloudflare recommends validating the `Cf-Access-Jwt-Assertion` JWT at the application, including issuer and audience. The Functions implementation follows that model using `jose`.

## Runtime behavior

The browser writes state to localStorage immediately.

On startup:

1. load local state;
2. authenticate through Cloudflare Access;
3. fetch remote state;
4. select the newest state per item;
5. upload local-newer state when writes are enabled;
6. merge remote saved snapshots into the local Saved library.

If Access or D1 is unavailable, the UI shows `LOCAL` and remains usable on that device.

When authenticated sync is fully available, it shows `SYNCED`.

## Historical compatibility

The previous local state key used `consumed`. On first load, v1 data is migrated to the explicit `read` field and written to the v2 local state key.
