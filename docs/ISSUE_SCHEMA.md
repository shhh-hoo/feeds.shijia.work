# Daily Issue schema v2

Status: **Canonical — Phase 2 system convergence**  
Established: 2026-09-19

This document defines the serialized contract for a published Daily Issue. It implements the product and ownership decisions in `PRODUCT.md`, `ARCHITECTURE.md`, and `DECISIONS.md`; it does not redefine them.

## Canonical artifact

Published Issues live at:

```text
content/issues/YYYY-MM-DD.json
```

The file itself is sufficient to reconstruct the editorial Issue. Rendering it must not require D1, `/api/feed`, a Saved snapshot, or another editorial database.

The root shape is:

```json
{
  "schema": "feeds.daily-issue",
  "version": 2,
  "id": "issue-2026-09-19",
  "date": "2026-09-19",
  "timezone": "Asia/Singapore",
  "generatedAt": "2026-09-19T16:30:00+08:00",
  "publishedAt": "2026-09-19T18:00:00+08:00",
  "contents": [
    { "mode": "current", "items": [] },
    { "mode": "expansion", "items": [] }
  ]
}
```

`contents` is an ordered array of first-class editorial-mode sections. Each section's `items` array is its editorial order. Both Current and Expansion sections exist even when one contains no publishable Items; there is no quota.

The Issue ID is stable and date-derived for v2: `issue-YYYY-MM-DD`. A stable Item reference is therefore the pair `(issue.id, item.id)`, conventionally addressable as `issue-YYYY-MM-DD#item-id` by later readers.

## Item model

An Item is an editorial unit. The serialized shape deliberately separates four concerns:

```text
Item
├── editorial      what the Item says
├── presentation   reader intent, not layout
├── provenance     evidence, sources and claim classification
└── metadata       generation/editorial data not necessarily displayed
```

### `editorial`

Required:

- `title` — editorial identity.

Optional content forms:

- `lede` — short introduction;
- `body` — an ordered array of normal prose paragraphs;
- `entryPoint` — a concrete instruction such as “listen first to…” or “look for…”;
- `structured` — factual label/value data when structure is genuinely useful;
- `creator` — creator/author/artist/studio when relevant.

A publishable Item must contain actual editorial content beyond its title, but no one optional form is required. A short dispatch can use only a lede. A native essay can use several paragraphs. A listening recommendation may use a lede plus entry point. The schema does not force prose into bullets, “watch-for” fragments, or metric blocks.

### `presentation`

Phase 2 fixes a deliberately small vocabulary:

| Mode | Semantic intent | Must not encode |
| --- | --- | --- |
| `dispatch` | A bounded, concise update or signal that should be understood quickly | Current/Expansion, urgency score, card size |
| `essay` | Native Feeds prose where explanation/analysis is itself the main reading object | External article type, grid width, length tier |
| `object` | A visual/product/design/commercial artifact primarily meant to be inspected | Image dimensions, hero treatment, layout placement |
| `listening` | An audio work or listening experience where listening is the primary action | Current/Expansion, player implementation, recommendation score |
| `viewing` | A film, episode, series, video or other audiovisual work where viewing is primary | Player/provider UI, poster size, release priority |
| `reading` | An external literary/editorial/document work where reading the referenced work is primary | Native essay styling, text column width, source authority |

The modes exist because they imply materially different reader behavior. They remain orthogonal to Current/Expansion: for example, a listening Item can be either Current or Expansion.

`presentation.media` may carry optional media assets (`image`, `cover`, `poster`, `still`) with URL, alt text and optional credit. These are presentation assets, not layout instructions. v2 has no `span`, `card_type`, grid position, width or hero flag.

### `provenance`

`provenance.sources` stores self-contained source records with stable Item-local source IDs, names, original URLs, roles and optional source dates.

Source roles are:

- `primary` — direct evidence or the main referenced source;
- `verification` — independent verification;
- `context` — background/context;
- `availability` — where a work can be accessed, watched, listened to or obtained;
- `original` — the original text/work when source text itself is represented.

Two independent optional dimensions describe legal status and Feeds usage:

- `rights`: `public-domain`, `licensed`, or `permission`;
- `usage`: `link-only`, `quoted`, or `reproduced`.

`rights` describes the source material's legal/permission status when known and relevant. `usage` describes what Feeds actually does with that material. They must not be inferred from one another.

`provenance.assertions` classifies evidence-bearing statements as:

- `fact`;
- `attributed-claim`;
- `editorial-inference`;
- `source-text`.

Assertions are an optional, selective evidence ledger for claim-level auditability where that binding is materially useful. They must not mirror or paraphrase every sentence of `lede`, `body`, `entryPoint`, or other editorial prose, and they are not a second machine-facing copy of the article.

Facts, attributed claims and source text require valid source references. Editorial inference may be represented when there is a genuine reason to audit that inference, but routine editorial interpretation belongs in the editorial prose rather than being duplicated as an assertion. `source-text` must point to a source whose role is `original`; public-domain status, when known and relevant, belongs on that source's `rights` field.

This structure supports later editorial/source inspection without claiming that structural validation proves source truth.

### `metadata`

Optional metadata can contain:

- `interests`;
- `tags`;
- `language` / `region`;
- `discoveredAt`;
- `estimatedMinutes`;
- `relatedItemRefs`;
- `selectionReason` — optional machine/editorial rationale for generation or review workflows.

`selectionReason` is non-display metadata: it may preserve an operational selection rationale, but published prose must not depend on it or render a mandatory “why it matters” block. These metadata fields may help generation, validation, indexing or future reader behavior, but they are not required presentation chrome. `relatedItemRefs` are local Item IDs and must resolve inside the same Issue.

## Deterministic validation

`node scripts/validate-issues.mjs` validates canonical files under `content/issues/` using `scripts/issue-schema.mjs`.

It rejects deterministically detectable structural failures, including:

- wrong schema/version identity;
- malformed Issue ID/date/timezone/timestamps;
- publication timestamp whose local date does not match the Issue date;
- invalid, missing or duplicate Current/Expansion sections;
- malformed or duplicate Item IDs across the Issue;
- unsupported presentation modes;
- Items with no publishable content;
- malformed source records and URLs;
- unsupported source `rights` or `usage` values;
- broken source references;
- duplicate source IDs/references;
- source publication dates after the Issue date;
- Current Items with no dated source at all;
- invalid or dangling related-Item references;
- invalid canonical filename/date relationship.

The validator does **not** judge:

- whether prose is good;
- whether a source is truthful;
- whether a claim is substantively correct;
- whether a recommendation has good taste;
- whether an Item deserves publication;
- whether Current material is sufficiently important or fresh beyond deterministically impossible dates.

Those are editorial concerns for Phase 3.

## v1 → v2 migration

Phase 2 makes a clean cut because the repository has only one prototype v1 briefing and no meaningful published history to preserve in the old format.

Decision:

- `content/issues/` supersedes `content/briefings/` as the canonical published-content path;
- `content/briefings/2026-09-19.json` is replaced by the heterogeneous v2 fixture at `content/issues/2026-09-19.json`;
- `scripts/validate-briefings.mjs` is superseded by the v2 validator;
- no general v1 → v2 compatibility converter is introduced;
- the current React reader receives the v2 fixture through the narrow `src/data/issueAdapter.ts` compatibility adapter;
- the adapter produces the existing `DailyFeedSnapshot`/`FeedItem` runtime shape only for the pre-Phase-5 reader and Saved-state compatibility. That runtime shape is explicitly non-canonical.

The old `scripts/briefing-to-sql.mjs`, `functions/api/feed.ts`, and editorial tables in `migrations/0001_initial.sql` are intentionally left untouched. Phase 1 already marks that D1 editorial-content path as superseded. Removing/replacing it belongs to later convergence work; Phase 2 does not create a v2 SQL import path.

## Fixture

`content/issues/2026-09-19.json` is based on the existing 2026-09-19 Feeds sample material and demonstrates materially different forms in one Issue:

- a current listening recommendation (`listening`);
- a current culture update (`dispatch`);
- a sourced technical explanation (`essay`);
- a fashion/design archive as a visual research object (`object`);
- a film-culture editorial package to enter through its table of contents (`reading`).

The vocabulary also includes `viewing` for film/series/video recommendations even though this particular historical fixture did not contain a clean primary viewing object. The schema should not relabel a reading recommendation as viewing merely to exercise an enum value.

## Phase boundary

Phase 2 does not redesign the React reader, implement heterogeneous components, create the Editorial Skill, rewrite Scheduled Tasks, change D1 migrations, provision Cloudflare, migrate to Workers, or add recommender logic.

Phase 5 should remove the legacy reader adapter and consume `DailyIssueV2` directly. Later deployment work should serve GitHub-derived Issue artifacts rather than reconstructing editorial content from D1.
