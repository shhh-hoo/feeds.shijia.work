# feeds.shijia.work

A personal intelligence and cultural feed.

The product is a web app first, with daily snapshots as an export/archive format. It is designed around two jobs:

1. **Current signals** — stay current without filling the feed with low-signal news.
2. **Expansion** — continuously widen taste, methods, references, and source pools across design, software, learning, culture, media, fashion, commerce, literature, and adjacent fields.

## Current foundation

- React + Vite + TypeScript
- installable PWA
- responsive content-first feed
- Today / Saved / Archive views
- local-first reading state
- interest weights in `config/interests.yaml`
- future SQLite / Cloudflare D1 model documented in `docs/DATA_MODEL.md`

The current cards are scaffolding, not the final visual system.

## Local development

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
npm run preview
```

## Product constraints

- content is visually primary; titles are secondary index labels
- neutral UI; no decorative gradients or category-color system
- real media may carry its own color; the UI should not invent color
- current news does not get automatic priority over expansion
- design, screen & sound, literature, fashion, commerce, software craft, learning, queer culture, internet culture, and wildcard discovery are first-class inputs
- the durable system should remember discovery and exposure, not only final recommendations

## Next layers

1. durable item/source/exposure store
2. source pool + source discovery
3. discovery / normalization / ranking pipeline
4. repetition and diversity controls
5. richer media cards and daily snapshots
6. Cloudflare deployment


## Data foundation

- `config/sources.yaml` — scored, multi-domain source graph
- `config/search-policy.yaml` — search effort, source discovery and repetition controls
- `content/briefings/*.json` — structured daily snapshots
- `migrations/` — D1 schema
- `functions/api/` — Pages Functions for feed/state/exposure APIs
- `docs/D1_SETUP.md` — local and remote D1 setup
- `docs/SOURCE_STRATEGY.md` — retrieval and source-pool rules

Remote D1 writes are intentionally disabled until the deployment is protected by an authentication boundary.


## Cross-device reading

Reading state is local-first and syncs through Cloudflare D1 when the site is protected by Cloudflare Access.

- `✓` = read
- `☆ / ★` = save / unsave
- Saved items carry a lightweight snapshot so they remain visible on another device even when they came from an older daily briefing.
- The Access email is validated at the edge and hashed before it becomes the D1 user key.
- If sync is unavailable, the feed falls back to local state instead of blocking reading.

See `docs/CROSS_DEVICE_SYNC.md`.
