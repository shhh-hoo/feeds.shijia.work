# Feeds Architecture Contract

Status: **Canonical — Phase 1 system convergence**  
Established: 2026-09-19

This document defines ownership boundaries and interfaces. It intentionally separates the target architecture from implementation that currently exists in the repository.

## Primary invariant

**GitHub is the single canonical source of published editorial content and immutable Daily Issue history.**

No database, API cache, Saved snapshot, browser store, generated SQL, or deployment artifact may become a second editorial source of truth.

A deployed representation may be derived from GitHub content, but it must be reproducible from the canonical published Issue artifacts.

## System boundaries

### 1. Scheduled generation

Responsibility:
- gather or receive source material;
- apply repository-owned interests, source strategy, and search policy;
- produce candidate material for editorial processing on the configured cadence.

Inputs:
- repository configuration and source policy;
- external source evidence;
- time/cadence context.

Output:
- a candidate package for the editorial system.

It does **not** own published Issue history, user state, or reader rendering.

The exact Scheduled Task implementation and transport are outside Phase 1.

### 2. Editorial system

Responsibility:
- verify evidence and provenance;
- decide inclusion/exclusion;
- assign each accepted Item to Current or Expansion;
- write/edit natural editorial copy;
- select an appropriate presentation mode;
- perform multi-pass editorial QA;
- drop weak material rather than compressing or padding it to satisfy volume.

Input:
- candidate material plus source evidence.

Output:
- a validated Daily Issue artifact ready for publication.

Publication is complete only when the Issue is written to the canonical GitHub content history.

### 3. Published editorial content

Owner: **GitHub repository**.

Responsibility:
- store published Daily Issue artifacts;
- preserve immutable Issue history through version control;
- provide the canonical inputs from which the reader/deployment can be built.

The exact v2 Issue serialization and file path are Phase 2 concerns. The architectural ownership is not.

### 4. Reader presentation

Responsibility:
- load the current or historical published Issue;
- render Items according to their presentation modes;
- expose Today, Saved, and Archive using the product definitions in `PRODUCT.md`;
- record explicit personal reading actions without mutating editorial content.

The reader must not require editorial Items to be reconstructed from D1.

### 5. Personal state

Responsibility:
- preserve explicit reading state such as read/saved/skipped/liked and lightweight interaction events;
- support immediate local/offline behavior;
- support authenticated cross-device synchronization when provisioned.

Storage roles:
- browser local storage may hold immediate/offline state;
- D1 is the intended remote store for personal reading state and interaction records.

D1 must not become an editorial CMS.

The existing `saved_item_json` behavior may be treated only as a non-authoritative cache needed to render explicitly Saved material across devices. It must never define Archive or published Issue history, and it must never override GitHub editorial content.

### 6. Deployment

Canonical production direction:
- **Cloudflare Workers**
- static reader assets
- Worker/API endpoints
- D1 for personal state

This is a **target architecture**, not a claim that production has been provisioned or verified.

The repository currently contains Pages Functions-style API code and a Wrangler example configured around Pages. That implementation is pre-convergence scaffolding and must not be described as the verified production topology.

Issue #4 confirms that Cloudflare Access, D1 creation/binding, migrations, environment configuration, authenticated state reads/writes, and cross-device behavior remain account-side work that has not yet been verified.

## Logical data flow

```text
external sources + repo policy
          |
          v
 scheduled generation
          |
          v
   candidate package
          |
          v
   editorial system
          |
          v
 validated Daily Issue
          |
          v
 GitHub published content  <---- single editorial source of truth
          |
          +----------------------> build/deploy derived static assets
          |                                      |
          |                                      v
          +-----------------------------------> reader
                                                  |
                                                  v
                                    explicit personal actions
                                                  |
                              +-------------------+------------------+
                              |                                      |
                              v                                      v
                       local/offline state                  authenticated API
                                                                     |
                                                                     v
                                                             D1 personal state
```

## Persistence contract

| Store | Canonical responsibility | Must not own |
| --- | --- | --- |
| GitHub | Published Issue content, immutable Issue history, repository policy/configuration | Personal per-user reading state |
| D1 | Authenticated personal reading state and interaction records | Published editorial Items, Issue history, editorial ranking/content CMS |
| Browser local storage | Immediate/offline personal state and reconciliation input | Published Issue history |
| Build/static assets | Derived reader representation | Independent editorial authority |

## Current repository contradictions

The repository contains implementation from multiple earlier directions. These are evidence of current code, not canonical architecture.

### D1 content duplication

`migrations/0001_initial.sql` defines `sources`, `items`, `item_sources`, `briefings`, and `recommendations`; `scripts/briefing-to-sql.mjs` copies briefing content into those tables; `functions/api/feed.ts` reads editorial content back from D1.

That path creates a duplicate editorial content database and is **superseded as an architectural direction**. It must not be expanded in Phase 2.

No migration is changed in Phase 1. Later phases must reconcile or retire this content-serving path without losing the personal-state work.

### Personal-state direction

`migrations/0002_cross_device_reading_state.sql`, PR #3, `docs/D1_SETUP.md`, and `docs/CROSS_DEVICE_SYNC.md` establish a narrower D1 responsibility around reading state/events. That direction is aligned with this contract, subject to the rule that any Saved snapshot is non-authoritative.

### Archive behavior

The current React `Archive` branch only sorts Items from the currently loaded feed. It does not load historical Daily Issues. It is therefore a placeholder and not a compliant Archive implementation.

### Deployment state

Cloudflare-related code exists, but Issue #4 remains open with all account-side provisioning and verification steps outstanding. Nothing in this repository should be read as evidence that Workers, Access, D1, or cross-device sync are production-provisioned.

## Interface rule for later phases

Each subsystem may evolve independently if it preserves these ownership boundaries:

- Scheduled generation proposes.
- Editorial system decides and writes.
- GitHub publishes and preserves.
- Reader presents.
- Personal-state services remember explicit user state.
- Deployment delivers the reader and state API.

No later phase should collapse those responsibilities back into one database-backed feed service.
