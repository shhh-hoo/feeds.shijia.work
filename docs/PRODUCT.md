# Feeds Product Contract

Status: **Canonical — Phase 1 system convergence**  
Established: 2026-09-19

This document defines the product semantics for Feeds. When older documentation, types, UI labels, migrations, or implementation details conflict with this contract, this document and `ARCHITECTURE.md` / `DECISIONS.md` take precedence.

## Product definition

Feeds is a **finite personal Daily Issue**: a deliberately edited edition for one day, with a clear beginning and end.

It is not an infinite feed, a dashboard, or a stream whose primary goal is to maximize continued consumption. The product should make a bounded editorial judgment about what is worth the user's attention today and what is worth expanding into beyond the current news cycle.

The **Daily Issue** is the primary product object. Individual Items belong to an Issue. Cards, tiles, spans, content blocks, or other rendering structures are presentation mechanisms, not the product model.

## Canonical terminology

### Issue

A dated, finite, published editorial edition.

An Issue:
- has a stable identity, date, timezone, publication metadata, and ordered editorial contents;
- contains two editorial modes: **Current** and **Expansion**;
- is complete when published rather than continuously extending;
- becomes part of immutable Issue history in GitHub after publication.

There is no requirement that either mode fill a quota. A mode may contain fewer Items, or no Item, when the editorial system cannot justify stronger material.

### Item

A discrete editorial unit selected into an Issue.

An Item may synthesize or point to one or more sources. It is not synonymous with a source article and it is not synonymous with a visual card. Its editorial meaning must survive changes in layout or presentation.

Each Item belongs to one editorial mode within its Issue and may carry a separate presentation mode.

### Current

The editorial mode for material whose value depends materially on timeliness, newness, or a current change in the world.

Current material should be date-checked and evidence-backed. Recency alone is not sufficient reason for inclusion.

### Expansion

The editorial mode for material chosen to widen taste, references, methods, disciplines, scenes, or source pools.

Expansion is quality-first. Age is not a penalty and archival material may be preferable to something newer.

### Presentation mode

A rendering choice for an Item. Different material may need different presentation structures.

Presentation mode is independent from Current/Expansion. The system must not force all Items through one generic card shell. The exact presentation-mode vocabulary belongs to Phase 2 and later reader work; Phase 1 only establishes that presentation is not the content model.

### Saved

An explicit user retention action on an Item.

Saved is personal state. An Item is Saved because the user deliberately saved it, not because the system inferred that it should be retained. Saved is not a historical record of what appeared in prior Issues.

### Archive

The chronological history of previously published Daily Issues.

Archive is Issue history, not a sorted list of today's Items, not a Saved-items library, and not a database reconstruction of past content.

## Editorial contract

The Daily Issue should optimize for editorial value, not output volume.

The editorial system must:
- prefer **dropping a weaker Item** over forcing it into the Issue;
- preserve natural prose when explanation is needed rather than compressing everything into card-sized fragments;
- keep Current and Expansion distinct without treating either as a mandatory numerical quota;
- allow source, medium, and subject matter to influence presentation;
- preserve provenance sufficiently for claims to be checked;
- treat retrieval/ranking heuristics as inputs to editorial judgment, not as the product itself.

Existing ratio targets in configuration are search or selection guidance only. They are not a guarantee that a published Issue must contain a fixed Current/Expansion ratio.

## Personalization boundary

Explicit configuration and explicit user actions may influence the system.

Automatic behavioral taste inference, recommendation scoring learned from interaction history, or self-reinforcing preference optimization is **out of scope** until enough behavioral evidence exists to justify it.

Reading events may be retained for product operation and later analysis, but their existence does not authorize an inferred taste model.

## Product surfaces

The intended product surfaces are:

- **Today** — the current finite Daily Issue;
- **Saved** — explicitly retained Items;
- **Archive** — historical Daily Issues.

These names describe product semantics, not the current implementation quality. A UI label is not considered correct merely because it already exists in the React app.

## Scope boundary for convergence

Phase 1 establishes contracts only. It does not change the React reader, content schema, migrations, Scheduled Tasks, Cloudflare provisioning, or production deployment.

The current React/card implementation and v1 data structures are scaffolding that must be reconciled in later phases against this contract.
