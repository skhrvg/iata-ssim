# CLAUDE.md

## What this is

Zero-dependency TypeScript parser library for IATA SSIM (Standard Schedules
Information Manual) data formats. Ships as ESM-only npm package `iata-ssim`.
No runtime deps; works in Node, browsers, edge, Workers, Deno.

Currently implements **Chapter 7 — Schedule Data Set** (`.ssim` files, fixed-width
200-byte records). Other SSIM chapters (SSM/ASM/SCR) are planned, see
`docs/overview/roadmap.md`.

Validated against the **March 2012** edition (and March 2011 as supplemental).
Newer editions may add DEI codes or revise byte assignments — if a user asks
about a field that doesn't match the current code, suspect edition drift first.

The library was largely AI-authored with human review. Samples validator at
`samples-validator/` parses 14 real-world `.ssim` files (~48 500 legs across
10 vendors) for sanity-testing.

## Architecture

Two public entry points:

- **`iata-ssim`** ([src/index.ts](src/index.ts)) — Chapter 7 parser **plus**
  shared SSIM-wide utilities (`parseIataDate`, `parseIataTime`,
  `parseUtcOffsetMinutes`, `parseDaysOfOperation`,
  `parseJointOperationAirlines`, `IataTime`). Utilities live here because they
  will be reused by future SSM/ASM/SCR modules.
- **`iata-ssim/sds`** ([src/sds/index.ts](src/sds/index.ts)) — Chapter 7 only,
  no shared utilities.

Don't move utilities into `sds/` or duplicate them. That split is intentional.

Build is done by **tsdown** ([tsdown.config.ts](tsdown.config.ts)) — emits
ESM only, with shared chunk files (e.g. `dist/sds-C6hfYRDJ.js`). The hashed
chunks **are** the actual code — both entry files re-import from them. Don't
try to "clean up" the dist.

## Code conventions

- IATA spec uses **1-indexed, inclusive** byte positions ("bytes 15 to 21").
  Helpers preserve that: `sliceField(line, 15, 21)` returns
  `line.slice(14, 21)`. **Don't convert to 0-indexed.**
- `sliceTrim()` calls `String.prototype.trim()` — only whitespace, not digits.
  Leading-zero fields like `"001"` survive intact. Don't add special handling.
- Test fixtures build 200-byte records by **manual string concatenation with
  inline byte-position comments** (see `test/sds/*.test.ts`). ESLint is
  configured to allow this style — don't refactor with template literals.
- Record types are a const-object **and** matching type (see `RecordType` in
  [src/sds/types.ts](src/sds/types.ts)). The `// eslint-disable-next-line
ts/no-redeclare` comment is intentional — it's the documented public-API
  shape.
- Public errors live in [src/sds/errors.ts](src/sds/errors.ts) — extend
  `ScheduleDataSetParseError`, don't introduce new error classes lightly.

## Commands

Use **pnpm** (the project is locked to `pnpm@10.33.2` via `packageManager`).

| Task               | Command                                         |
| ------------------ | ----------------------------------------------- |
| Install            | `pnpm install`                                  |
| Lint               | `pnpm lint` (eslint via `@antfu/eslint-config`) |
| Type-check         | `pnpm type-check`                               |
| Tests              | `pnpm test` (vitest, 13 files / 76 cases)       |
| Build              | `pnpm build` (tsdown)                           |
| Watch build        | `pnpm dev`                                      |
| Docs (local)       | `pnpm docs:dev` — VitePress at `localhost:5173` |
| Docs build         | `pnpm docs:build`                               |
| Real-sample sanity | `pnpm samples:validate`                         |

Before claiming a change is done, run lint + type-check + test. The CI on
push/PR runs exactly that plus build.

## Docs

VitePress site at **<https://iata-ssim.skhr.vg/>** (deployed via GH Actions
from `master`, custom domain, CNAME written at deploy time). Source in
[docs/](docs/). The site has a Vue-component-based interactive Playground in
[docs/.vitepress/theme/components/Playground.vue](docs/.vitepress/theme/components/Playground.vue).

When changing public API, also update:

- [docs/api/types.md](docs/api/types.md) (interfaces)
- [docs/api/functions.md](docs/api/functions.md) (function signatures)
- [docs/sds/field-reference.md](docs/sds/field-reference.md) (if record fields change)

## CI/CD

- **[.github/workflows/ci.yml](.github/workflows/ci.yml)** — push/PR:
  lint → type-check → test → build.
- **[.github/workflows/release.yml](.github/workflows/release.yml)** —
  on GitHub Release published: full proof → publish to npm (`iata-ssim`,
  with provenance) → publish to GitHub Packages (`@skhrvg/iata-ssim`, via
  in-place name swap) → bump patch + push to master → build & deploy docs
  to GH Pages.

**Release flow (manual part):** bump version in `package.json` to the target
release, push to master, create a Release in the GitHub UI with tag
`vX.Y.Z` — GitHub creates the tag itself on the master tip. The workflow
does the rest.

## Don't

- Avoid runtime dependencies.
- Don't `npm` / `yarn` — pnpm only.
- Don't loosen `noUncheckedIndexedAccess` or other strict tsconfig flags.
- Don't write CHANGELOG entries via automation — the release workflow leaves
  it alone; the human edits it per release.
