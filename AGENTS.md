# AGENTS.md

## Prefer official documentation over re-reading the library

Before diving into the library's source to understand how something works, read the official docs first:

- **This project**: `README.md`, `CHANGELOG.md`, and the docs pages in `apps/docs/content/docs/*.mdx`.
- **Dependencies**: the official documentation / API reference of the library in question (Next.js, Fumadocs, Tailwind, Motion, Radix, shadcn CLI, TypeScript, pnpm…).

Only open the library's source when the docs don't answer the question, or to check behaviour that is specific to this repo. Exploring the whole codebase to re-derive how a third-party API works is slower and less accurate than reading its docs.

Same rule for this repo: check this file, the docs pages and the relevant module's own comments/exports before reading every file.

## Commands

```bash
pnpm install          # clean install if the lockfile or symlinks look broken
pnpm dev              # docs site on :3000 (pnpm --filter @arc/docs dev)
pnpm typecheck        # pnpm -r typecheck (arc + @arc/docs)
pnpm lint             # eslint . (from the repo root)
pnpm check:registry   # validates packages/arc/registry.json and its files
pnpm check            # typecheck + lint + check:registry
```

Generated files: `apps/docs/lib/registry-groups.ts` (from the README tables) and
`apps/docs/content/docs/changelog.mdx` (from `CHANGELOG.md`) — regenerate with
`pnpm --filter @arc/docs groups` / `pnpm --filter @arc/docs changelog`, don't edit them by hand.

## Layout

- `packages/arc` — the Arc component library and its shadcn registry (`registry.json`, `registry/`, `public/r/`).
- `apps/docs` — the Fumadocs site (`app/`, `content/docs/`, `site/`, `lib/`).

## Verification

Run lint and typecheck once at the end of a batch of edits, not after every change.
