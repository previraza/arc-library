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
pnpm dev              # docs site on :3000 (pnpm --filter @manicat/docs dev)
pnpm typecheck        # pnpm -r typecheck (arc + @manicat/docs)
pnpm lint             # eslint . (from the repo root)
pnpm check:registry   # validates packages/manicat/registry.json and its files
pnpm check            # typecheck + lint + check:registry
```

Generated files: `apps/docs/lib/registry-groups.ts` (from the README tables) and
`apps/docs/content/docs/changelog.mdx` (from `CHANGELOG.md`) — regenerate with
`pnpm --filter @manicat/docs groups` / `pnpm --filter @manicat/docs changelog`, don't edit them by hand.

## Layout

- `packages/manicat` — the Manicat UI component library and its shadcn registry (`registry.json`, `registry/`, `public/r/`).
- `apps/docs` — the Fumadocs site (`app/`, `content/docs/`, `site/`, `lib/`).

## Framework ports

`packages/manicat/frameworks.json` is the registry of formats: React `*.tsx`, React Native `*.rn.tsx`, Vue `*.vue`, Svelte `*.svelte`, Swift `*.swift`.
A port is a file with one of those suffixes placed next to the item's React source (`registry/components/button/button.vue`):

- no change to `registry.json`: `pnpm --filter manicat build:registry` publishes it as `public/r/<item>-<framework>.json` and `check:registry` verifies it;
- the docs site finds it on disk and adds the framework to the switcher (Install, Source, API tabs); the choice is remembered in the browser;
- an optional usage snippet goes in `apps/docs/content/usage/<item>.<framework-id>.txt`;
- customisation: `classNames.*` on the web, `styles.*` on native (`classNamesProp` in `frameworks.json`);
- a new framework is one more entry in `frameworks.json` (add its `lang` for the highlighter if Shiki needs a mapping in `apps/docs/lib/highlight.ts`).

React Native files import tokens from `lib/rn-tokens.ts`; Vue files read the CSS variables of `foundation.css`.

## Verification

Run lint and typecheck once at the end of a batch of edits, not after every change.
