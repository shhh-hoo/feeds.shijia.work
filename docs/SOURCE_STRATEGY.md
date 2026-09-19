# Source strategy

The pool is a graph, not a whitelist.

Each source has:

- interests it can serve
- mode: current / expansion / discovery
- source type
- cadence
- authority
- taste fit
- signal density
- commercial bias

## Retrieval order

1. **Strict current** — 24-72h, date-verified, primary sources first.
2. **Specialist pool** — publications with domain-specific taste or expertise.
3. **Community signal** — discovery only until independently verified.
4. **Expansion/archive** — quality-first; age is not a penalty.
5. **Source discovery** — actively find new critics, curators, studios, labels, archives and journals.

## Important distinction

A high-authority source is not automatically a high-taste source.

For example:

- official product docs: authority high, taste relevance depends on the task
- community platforms: authority low, discovery value can be high
- specialist cultural publications: authority may be medium-high, taste fit can be very high

The ranking layer should use these dimensions separately.

## Search budgets

`config/search-policy.yaml` defines per-interest query and source-check budgets.

Budgets are search effort, not output quotas. A category with no strong result should output nothing rather than fill its quota with weak material.

## Pool growth

Every week, add at least five candidate sources across under-covered regions, languages or disciplines. Promote a candidate only after repeated useful hits; demote sources that repeatedly return low-signal or overly commercial material.
