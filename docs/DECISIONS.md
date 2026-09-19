# Feeds Canonical Decisions

Status: **Canonical — system convergence**  
Established: 2026-09-19

This log records the decisions that govern subsequent Feeds work. Earlier repository artifacts remain useful implementation history, but they do not override accepted decisions here.

## Accepted decisions

### D-001 — Daily Issue is the primary product object

**Decision:** Feeds is a finite personal Daily Issue with a clear end.

**Consequences:**
- the product is not an infinite feed or dashboard;
- historical navigation operates on Issues;
- Item/card-level implementation details cannot redefine the product.

**Supersedes:** README/PR #1 language that described the web app/feed as primary and daily snapshots mainly as export/archive format.

### D-002 — Every Issue has Current and Expansion editorial modes

**Decision:** Current and Expansion are first-class editorial modes inside each Daily Issue.

**Consequences:**
- Current is time-sensitive and date-verified;
- Expansion is quality-first and may be archival;
- neither mode has a hard output quota;
- configured ratios are guidance for retrieval/selection, not publication requirements.

### D-003 — Item semantics are independent from presentation

**Decision:** An Item is an editorial unit; a card is only one possible rendering.

**Consequences:**
- different Items may use different presentation modes;
- presentation mode is separate from Current/Expansion;
- exact v2 presentation vocabulary is deferred to Phase 2;
- fields such as `card_type`, `span`, and the existing generic content-block/card shell cannot be treated as canonical product structure.

**Supersedes:** card-first modeling in PR #1/PR #2, `src/types.ts`, the current React `Card` component, and `recommendations.card_type`.

### D-004 — GitHub is the sole source of truth for published editorial content

**Decision:** Published Daily Issues and their immutable history live canonically in GitHub.

**Consequences:**
- deployed files/APIs may be derived from GitHub;
- a database copy cannot become an independent content authority;
- Archive must resolve historical GitHub-published Issues.

### D-005 — D1 is for personal state, not an editorial CMS

**Decision:** D1's durable role is authenticated personal reading state and interaction records.

**Consequences:**
- the v1 content tables and D1-fed `/api/feed` path are not the target architecture;
- new editorial schema work must not extend D1 as a second content store;
- a Saved-item snapshot, if temporarily retained, is a non-authoritative cache tied to explicit Saved state.

**Supersedes:** the duplicate-content database direction introduced in PR #2, `migrations/0001_initial.sql`, `scripts/briefing-to-sql.mjs`, and `functions/api/feed.ts`.

### D-006 — Generation, editorial, reader, state, and deployment are separate subsystems

**Decision:** Scheduled generation, editorial writing/QA, published content, reader presentation, personal state, and deployment have explicit ownership boundaries.

**Consequences:**
- Scheduled generation proposes candidates rather than owning the final product;
- editorial processing is allowed to reject or rewrite candidates;
- the reader cannot mutate canonical editorial content;
- state storage cannot define published Issue history.

### D-007 — Editorial quality beats volume and compression

**Decision:** The editorial system should drop weak Items instead of forcing output volume, and should preserve natural prose instead of compressing all material into a generic card format.

**Consequences:**
- search budgets and target ratios are not output quotas;
- empty or small sections are acceptable when evidence is weak;
- prose length follows editorial need rather than a single shell.

### D-008 — Saved and Archive are different product concepts

**Decision:**
- **Saved** = explicit user retention of an Item.
- **Archive** = historical published Daily Issues.

**Consequences:**
- Saved is personal state;
- Archive is editorial history;
- Saved snapshots cannot substitute for Archive.

**Supersedes:** the current `src/App.tsx` Archive behavior, which merely re-sorts Items from the currently loaded feed, and any interpretation of Saved/history snapshots as an Archive implementation.

### D-009 — Automatic inferred taste scoring is deferred

**Decision:** Behavior-derived taste inference, automatic recommendation learning, and self-adjusting preference scoring are out of scope until enough behavioral evidence exists.

**Consequences:**
- explicit interests and editorial/search heuristics may still guide generation;
- current events/state may be recorded without turning them into an inferred preference model;
- existing score fields are implementation metadata, not a commitment to an adaptive recommendation engine.

**Supersedes/defer:** the long-term-personalization implication in `docs/DATA_MODEL.md` where it would require inferred behavioral scoring now.

### D-010 — Production direction is Cloudflare Workers + static assets + API/D1

**Decision:** The production target is Cloudflare Workers serving the application/static assets with API endpoints and D1-backed personal state.

**Consequences:**
- current Pages Functions code is transitional implementation, not the canonical production topology;
- the documentation must distinguish target architecture from deployed fact;
- Phase 1 performs no provisioning.

**Verification status:** not production-verified. Issue #4 remains open and documents outstanding account-side Access/D1 provisioning and E2E checks.

## Explicitly superseded assumptions

| Existing assumption | Status | Canonical replacement |
| --- | --- | --- |
| "Web app/feed first; daily snapshots are mainly export/archive" | Superseded | Daily Issue is the product object; the reader is its presentation surface |
| One generic card/content-block shell defines content | Superseded | Item is semantic content; presentation mode is independent and may vary |
| `card_type`, `span`, or card layout belongs to the core product model | Superseded | Presentation details are reader/schema concerns, not product identity |
| D1 should durably store Items/briefings/recommendations and serve the feed | Superseded | GitHub owns published editorial content; D1 owns personal state |
| `/api/feed` reconstructing editorial content from D1 is the target read path | Superseded | Reader consumes a GitHub-derived published Issue representation |
| Current Archive UI is an Archive | Superseded | Archive loads historical Daily Issues |
| Saved snapshots can stand in for content history | Superseded | Saved snapshot is at most a cache for explicit retention; Archive comes from GitHub |
| Target Current/Expansion percentages are hard publication quotas | Superseded | They are non-binding search/selection guidance |
| Interaction history should immediately drive automatic taste scoring | Deferred / out of scope | Wait for sufficient behavioral evidence and a later explicit decision |
| Existing Pages Functions configuration proves the production deployment model | Superseded | Workers is the target; production provisioning remains unverified |

## Historical documents and code

The following remain useful as implementation history but are non-canonical when they conflict with this log:

- `docs/DATA_MODEL.md`
- `docs/SOURCE_STRATEGY.md`
- `docs/CROSS_DEVICE_SYNC.md`
- `docs/D1_SETUP.md`
- `src/types.ts`
- `src/App.tsx`
- `migrations/*`
- PRs #1–#3

No file in this list is modified by Phase 1 solely to make old implementation match the new contracts. Reconciliation belongs to the later convergence phases.

## Phase 2 boundary

Phase 2 may define the Daily Issue schema v2 only if it preserves:
- Issue-first structure;
- Current/Expansion as editorial modes;
- presentation independent from editorial semantics;
- GitHub as the sole published-content authority;
- no requirement for D1 editorial duplication;
- enough identity/provenance to support real historical Archive behavior.

Exact serialization, presentation-mode enum, and migration path from the v1 briefing shape are Phase 2 design work, not unresolved Phase 1 contracts.

### D-011 — Published Daily Issues use the self-contained v2 Issue artifact

**Decision:** Canonical published content is serialized as `feeds.daily-issue` version 2 under `content/issues/YYYY-MM-DD.json`.

**Consequences:**
- the Issue root carries stable identity, date/timezone, generation/publication timestamps, and ordered editorial contents;
- Current and Expansion are explicit first-class sections; each section is present even when empty, and neither has a publication quota;
- Item semantics are split into `editorial`, `presentation`, `provenance`, and optional machine/editorial `metadata`;
- the v1 presentation vocabulary is `dispatch`, `essay`, `object`, `listening`, `viewing`, and `reading`; these describe reader intent and never encode Current/Expansion, priority, or layout;
- canonical artifacts contain enough Item/source identity and provenance to reconstruct historical Issues from GitHub without D1;
- `content/issues/` supersedes `content/briefings/`; the single prototype v1 briefing is migrated by clean cut rather than by a general compatibility converter;
- the current React reader may temporarily consume v2 through a one-way legacy adapter until Phase 5;
- no v2 D1 import path is created, and the superseded v1 editorial database/API path remains legacy code for later removal.

**Schema reference:** `docs/ISSUE_SCHEMA.md`.

