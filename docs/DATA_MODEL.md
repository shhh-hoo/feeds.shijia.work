# Data model direction

The PWA starts local-first. Item reading state is stored in localStorage so the interface can be used before a backend exists.

The durable data layer should later move to SQLite / Cloudflare D1 without changing the feed UI contract.

## Core entities

### items

- id
- canonical_url
- title
- type
- domain / interest
- creator
- published_at
- discovered_at
- language
- region
- summary / content blocks
- source_id
- freshness
- quality_score
- interest_score
- novelty_score
- final_score

### exposures

Tracks the funnel, including items that were discovered but never shown.

- item_id
- discovered
- considered
- selected
- shown
- opened
- saved
- consumed
- skipped
- liked
- timestamps

### recommendations

- item_id
- briefing_date
- reason
- card_type
- priority
- estimated_minutes
- consumption_mode

### sources

- id
- name
- domain
- category
- authority
- taste_fit
- signal_density
- commercial_bias
- last_checked

### feedback

- item_id
- state
- reason
- timestamp

## Principle

The system should remember what it has already discovered, not only what it finally recommended.

That enables deduplication, repetition control, source-quality learning, and long-term personalization without turning the UI into a dashboard.
