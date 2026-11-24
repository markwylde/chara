# Tasks

## 1. Repository setup

- [x] 1.1 Make an initial commit on `main` with the OpenSpec scaffolding, then create a git worktree on branch `feat/chara-avatar-library`; verify with `git worktree list`
- [ ] 1.2 Add the root `package.json` (private, npm workspaces `packages/*` and `apps/*`, Node ≥20 engines), `.gitignore`, MIT `LICENSE`, `tsconfig.base.json` (strict) and `biome.json`; verify that `npm install` succeeds and `npx biome check .` runs
- [ ] 1.3 Scaffold `packages/chara` (entries `.`, `./core`, `./themes/*`) and `packages/chara-react` (externals `react`, `react/jsx-runtime` and `@markwylde/chara`) with `package.json` (`exports`, `sideEffects: false`, `files: ["dist"]`, `publishConfig.access: public`), tsup and Vitest configs; verify that `npm run build -ws` creates ESM, CJS and `.d.ts` files for every entry
- [ ] 1.4 Add the root scripts `check`, `typecheck`, `test` and `build`; verify each runs green

## 2. Core engine (`@markwylde/chara`)

- [ ] 2.1 Implement name normalisation (NFC, trim, collapse whitespace, locale-independent lowercase, empty → "chara", `normalize: false` path) with tests for every spec scenario, including NFC-equivalent strings and an empty raw name
- [ ] 2.2 Implement cyrb128 + sfc32 seeded random (`f`, `int`, `pick`, `range`, `chance`) with tests for repeatability, order independence and per-theme namespacing
- [ ] 2.3 Implement `SvgNode`, `el` and `serialize` (attribute and text escaping, removal of XML-invalid characters, stable attribute order, self-closing empty elements), with tests
- [ ] 2.4 Implement the colour helper (`hsl` → `#rrggbb`), `f1`, `mirrorX` and `smoothClosedPath`, with tests against known values
- [ ] 2.5 Implement the safety allowlist (tags, attributes, local-only `url(#id)` references that must resolve within the document, text only in `title`) and `CharaSafetyError`, with rejection tests for `script`, `foreignObject`, `on*`, `style`, `href`, external `url()` and dangling references
- [ ] 2.6 Implement `ThemeContext` (`rand`, `hsl`, `id`, `ref`, `def`, `el`, `mirrorX`, `smoothClosedPath`, `f1`), `defineTheme` with id validation, and the frame. The frame covers size validation (RangeError), radius clamp and default, title trimming with `role="img"` or `aria-hidden`, option-aware 64-bit IDs, `idPrefix` validation, the clip path and the background. Test with one-circle and gradient-background custom themes, covering every option edge case in the spec
- [ ] 2.7 Implement the `/core` entry (`createAvatarTree`, `createAvatar`, `createAvatarDataUri`, which need a theme object and run validation) and the root entry (id or object, defaulting to Mecha, with the unknown-id error). Test tree/string equality, the data URI round-trip, and well-formed XML (`@xmldom/xmldom`)

## 3. Themes

- [ ] 3.1 Port Mecha from `reference/poc.html` to the theme context, keeping the order of random calls. Add golden SVG snapshots for the 24 proof-of-concept names, and check them side by side against the proof of concept
- [ ] 3.2 Port Critter, including the clip-path markings registered through `ctx.def`. Add golden snapshots, and test that the outline is symmetric and differs between two names
- [ ] 3.3 Port Sigil with an injectable random source, the 30-attempt retry and the fixed fallback walk. Add golden snapshots, plus tests for mirror symmetry, the off-centre property over 1,000 names and a forced exhaustion test of the fallback
- [ ] 3.4 Add an ID test that inlines 20 names × 3 themes × radii 0/24/50 into one document and asserts no ID is defined twice with different content, including a check that "Claudette" at radius 0 and at radius 50 share no ID
- [ ] 3.5 Add the 10,000-name collision test using normalised-name deduplication and ID canonicalisation; verify it passes in under 10 seconds
- [ ] 3.6 Add the tree-shaking test that bundles the documented `/core` + `/themes/sigil` example with esbuild and asserts the metafile has no Mecha or Critter modules
- [ ] 3.7 Write `packages/chara/README.md` (install, API, options and their validation, entry points, custom themes and the allowlist, stability rule) and verify that its code samples compile in a typechecked docs test file

## 4. React package (`@markwylde/chara-react`)

- [ ] 4.1 Implement the node-to-element renderer using the allowlist's attribute table, with a test that every allowlisted attribute is mapped
- [ ] 4.2 Implement `Avatar` (memoised, `forwardRef`, the prop merge order generated < caller < reserved). Test that the parsed `renderToStaticMarkup` output equals the parsed core SVG for each theme, plus tests for overrides (width, ARIA, className) and ignored reserved props
- [ ] 4.3 Implement `useAvatarDataUri` and verify it equals `createAvatarDataUri`
- [ ] 4.4 Add a hydration test (server render, then `hydrateRoot` with duplicate avatars, with no console errors) and an unrelated-re-render test that asserts no regeneration
- [ ] 4.5 Run the React tests against React 18 and 19 and verify both pass locally
- [ ] 4.6 Write `packages/chara-react/README.md` with usage examples and verify they compile in the docs test

## 5. Playground (`apps/playground`)

- [ ] 5.1 Scaffold a Vite + React app with `base: '/chara/'` and workspace source aliases; verify that `npm run dev -w playground` serves it
- [ ] 5.2 Build the name input with live Mecha, Critter and Sigil previews on light and dark surfaces, plus size and radius controls; verify by typing and dragging in the browser
- [ ] 5.3 Build the theme-switchable sample gallery, Copy SVG and Copy React (using a `JSON.stringify` name) with confirmation, and the fallback when the clipboard is refused. Verify with a unit test of the snippet builder for quotes, braces and newlines
- [ ] 5.4 Add Playwright tests for:
  - golden names in Chromium matching the Node snapshots
  - the built site working when served from `/chara/`
  - Copy SVG contents
  - the clipboard-refused fallback

## 6. Packaging, CI and release readiness

- [ ] 6.1 Add the packed-consumer test script. It packs both packages into a temporary project and checks ESM import, CJS require, the `/core` and `/themes/*` subpaths, `tsc` against the declarations, and that the React build contains no React or core source. Verify that it passes locally
- [ ] 6.2 Add a GitHub Actions CI workflow (Biome, typecheck, unit tests on a React 18/19 matrix, build, packed-consumer test, Playwright) and verify with `act` or by pushing the branch
- [ ] 6.3 Add a GitHub Pages deploy workflow for the playground on pushes to `main`
- [ ] 6.4 Add a root `README.md` (what Chara is, the three themes with images, package links, playground link) and verify that `npm pack --dry-run` lists only `dist`, `README`, `LICENSE` and `package.json` for both packages

## Workflow follow-up

- Owner creates `github.com/markwylde/chara`, enables Pages, and publishes `0.1.0` of both packages manually.
- Archive the change once it has been reviewed and merged.
- Track the Terminay integration as a separate change in the Terminay repo.
