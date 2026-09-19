# feeds.shijia.work

Feeds is a **finite personal Daily Issue**: a deliberately edited daily edition with two editorial modes, **Current** and **Expansion**.

The project is currently in **system convergence**. Phase 1 freezes the product and architecture contracts before any further feature/schema work.

## Canonical documents

- [Product contract](docs/PRODUCT.md)
- [Architecture contract](docs/ARCHITECTURE.md)
- [Decision log](docs/DECISIONS.md)

When older documentation or implementation conflicts with these three documents, the canonical contracts above take precedence.

System convergence is tracked in Issue #5.

## Current repository status

The repository contains a React + Vite reader and earlier Pages/D1 experiments from PRs #1–#3. Some of that implementation predates the canonical contracts and is intentionally left unchanged during Phase 1.

Key current facts:

- GitHub is the canonical source of published editorial content and immutable Daily Issue history.
- D1's target responsibility is personal reading state, not a duplicate editorial CMS.
- the current React card model and Archive behavior are scaffolding, not the final product contract;
- the production direction is Cloudflare Workers + static assets + API/D1;
- Cloudflare Access/D1 account-side provisioning and production E2E verification are still outstanding (Issue #4).

Phase 1 does **not** change the React UI, content schema, migrations, Scheduled Tasks, or Cloudflare provisioning.

## Local development

```bash
npm install
npm run dev
```

Verification commands available in the current implementation:

```bash
npm run test
npm run validate
npm run build
```
