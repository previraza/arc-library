# Roadmap

Where Manicat UI stands and what comes next, in the order to do it. The goal does not change: **one library, with React as the reference.**
Vue, Svelte, React Native and SwiftUI render the same thing (about 99% identical in visuals, motion, icons and fonts), are used the same
way, and customise the same way (`classNames` on the web, `styles` on native).

Updated 2026-10-14. The history lives in [CHANGELOG.md](CHANGELOG.md).

## How a port is done, and how it is checked

1. Read the React component and its CSS module. Port the DOM and the CSS as they are (`node scripts/port-css.mjs <item>`).
2. Put the motion in a shared controller in `packages/manicat/lib/<item>.ts` (vanilla `motion`, written against the DOM), so Vue and Svelte run
   the same code with the same springs and tokens. Each framework file only renders the markup and hands the elements over.
3. Rewrite the Usage snippet (`apps/docs/content/usage/<item>.<fw>.txt`) so it is the React demo, in that framework's idiom.
4. Check it: `node apps/viewer-shared/render-parity.mjs --only <item> --demos-only --fw vue,svelte` at rest, then with `--act click|hover`,
   `--real`, `--drag <px>`, `--sel <css>`, `--type <text>`. A port is done when every state is within 2.5% of the pixels and has the same
   words and controls.
5. `pnpm check` (typecheck, lint, registry and parity checks) once at the end of a batch, then commit.

Lessons that save time:

- Vue patches a `:style` object key by key on every render, so never bind a style key that a controller also writes.
- A `let` assigned in a Vue template compiles to `.value`; put such handlers in the script.
- In Svelte, never name a variable `state` (it shadows `$state`), put `export type` in `<script module>`, and when focus must move in the
  same click use `flushSync` (the hidden text loses focus the moment layout is forced).
- Bits UI and Reka UI name their CSS variables differently; `port-css --vars=bits|reka` maps them, and `check:parity` treats them as equal.

## 1. Finish the Vue and Svelte ports (next up)

Done: every component up to and including the ones in [the changelog of 2026-10-14](CHANGELOG.md). Still to port faithfully, roughly by size
of audience:

- **Inputs and forms:** number field, money input, phone input, mention input, color picker, slider, shortcut recorder, signature pad,
  file upload, file dropzone, rich text editor, date range picker (then delete `range-calendar.*`), morph select, filter toolbar.
- **Data and charts:** line chart, bar chart, donut chart, streamgraph, brush chart, activity heatmap, json viewer.
- **Overlays and chat:** bottom sheet, toast stack, user menu, comment thread, chat thread, button group.
- **Blocks (22):** site header and footer, hero, CTA, FAQ, pricing and plan comparison, comparison table, stats band, logo marquee, blog grid,
  changelog feed, contact, newsletter, sign in, login, sign up, empty states, page header, and the rest.

Each one is a short loop: lib controller, two components, snippet, parity, commit.

## 2. React Native, faithful

Colours, fonts and the first icons are in. What remains is per component (about 120 demos still differ from React in the pixel diff):

- Finish the icon sweep (chevron, check and close in the components with rotating or animated glyphs), then use `lucide-react-native` everywhere.
- Set `lineHeight` and `letterSpacing` where the CSS does (the default is 1.4 and no tracking), and use `fontFamily: "display"` for headings.
- Rewrite every RN Usage snippet so it equals the React demo (for example the card demo is a different layout today).
- Match shadows, borders, radii and spacing per component against the React CSS, by looking at the React and React Native screenshots side by side (`--save <dir>` writes both).
- Port the motion with the built-in `Animated` API so it stays Expo Go compatible; use `react-native-svg` for charts.
- Make the RN viewer run the same states as the web (`--act`, `--drag`) so interactions are compared too.
- Keep `scripts/gen-rn-tokens.mjs` as the only place colours come from (`pnpm --filter manicat exec node scripts/gen-rn-tokens.mjs`).

## 3. SwiftUI, faithful

- SF Symbols matching the lucide icons (a table of lucide name to SF Symbol), and Inter/Geist bundled through `ManicatTokens`.
- The missing APIs found so far: `Skeleton` `loading` and children, the dropdown icon parameter.
- Token parity is automatic now (`ManicatTokens.swift` is generated). Add the accent presets to the components.
- There is no web viewer for Swift: extend the Linux type-check harness and add screenshot checks on macOS CI.

## 4. Examples for every framework

The docs have 137 React Examples. Write `apps/docs/content/examples/<ExportName>.<fw>.txt` for Vue, Svelte, React Native and Swift, then
verify them with `render-parity.mjs` without `--demos-only`.

## 5. Quality and release

- Full parity sweep of every item at rest and in its main interactions, and fix what regressed.
- Remove the last lint warning, run `pnpm check` in CI, and regenerate `registry-groups.ts` and `changelog.mdx` (`pnpm --filter @manicat/docs groups|changelog`).
- Known gaps to decide on: Svelte dialog and drawer do not hide siblings from assistive technology, ±1px popper offsets, the card quick look
  uses top/left/width/height instead of a true FLIP, Bits has no hidden native select (field count differs by one).
- Docs: a "Frameworks" page that explains the switcher, `classNames`/`styles`, fonts and icons per platform.
