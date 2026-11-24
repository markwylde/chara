# Tasks

## 1. Repository setup

- [ ] 1.1 Make an initial commit on `main` with the OpenSpec scaffolding, then create a git worktree on branch `feat/chara-avatar-library`; verify with `git worktree list`
- [ ] 1.2 Add the root `package.json` (private, npm workspaces `packages/*` and `apps/*`, Node ≥20 engines), `.gitignore`, MIT `LICENSE`, `tsconfig.base.json` (strict) and `biome.json`; verify that `npm install` succeeds and `npx biome check .` runs
- [ ] 1.3 Scaffold `packages/chara` and `packages/chara-react` with `package.json` (`exports` map, `sideEffects: false`, `files: ["dist"]`, `publishConfig.access: public`), tsup and Vitest configs and an empty `src/index.ts`; verify that `npm run build -ws` creates ESM, CJS and `.d.ts` files for both
- [ ] 1.4 Add the root scripts `check`, `typecheck`, `test` and `build`; verify each runs green on the empty packages

## 2. Core engine (`@markwylde/chara`)

- [ ] 2.1 Implement name normalisation (NFC, trim, collapse whitespace, lowercase, empty → fallback) with unit tests covering the spec scenarios
- [ ] 2.2 Implement cyrb128 + sfc32 seeded random (`f`, `int`, `pick`, `range`, `chance`) with tests for repeatability, order independence and per-theme namespacing
- [ ] 2.3 Implement the `SvgNode` type, `el` helper and `serialize` (attribute and text escaping, stable attribute order, self-closing empty elements), with tests including title escaping
- [ ] 2.4 Implement the colour helper (`hsl` → `#rrggbb`), the `f1` rounding, `mirrorX` and `smoothClosedPath`, with tests against known values
- [ ] 2.5 Implement the theme context, `defineTheme` and the frame: root `svg`, size, radius clamp 0–50 with default 24, title and `role="img"` or `aria-hidden`, deterministic `id()` with `idPrefix`, clip path, and solid or gradient background. Verify with tests using a one-circle custom theme
- [ ] 2.6 Implement `createAvatarTree`, `createAvatar`, `createAvatarDataUri`, theme resolution by id or object (defaulting to Mecha) and the unknown-id error. Verify with tests for tree/string equality, data URI round-trips, and well-formed XML with no script or external URLs (`@xmldom/xmldom`)

## 3. Themes

- [ ] 3.1 Port Mecha from `reference/poc.html` to the theme context, keeping the order of random calls. Add golden SVG snapshots for the 24 proof-of-concept names and check them side by side against the proof of concept
- [ ] 3.2 Port Critter, including the clip-path markings. Add golden snapshots, plus a test that the body outline is symmetric and differs between two names
- [ ] 3.3 Port Sigil, including the gradient and the retry loop for at least three off-centre strokes. Add golden snapshots, plus tests for mirror symmetry and the off-centre property over 1,000 names
- [ ] 3.4 Add theme subpath exports (`@markwylde/chara/themes/<id>`) and verify that a tree-shaken bundle importing only Sigil contains no Mecha or Critter code (an esbuild metafile check in the test)
- [ ] 3.5 Add a 10,000-name, three-theme collision test and verify it passes in under 5 seconds
- [ ] 3.6 Write `packages/chara/README.md` (install, API, options, custom themes, stability promise) and verify that its code samples compile through a typechecked docs test file

## 4. React package (`@markwylde/chara-react`)

- [ ] 4.1 Implement the SVG attribute-name table and a node-to-element renderer, with tests that every attribute used by the three themes is mapped
- [ ] 4.2 Implement `Avatar` (memoised, `forwardRef`, pass-through props) and verify that `renderToStaticMarkup` output equals the core SVG for each theme
- [ ] 4.3 Implement `useAvatarDataUri` and verify that it equals `createAvatarDataUri`
- [ ] 4.4 Add a hydration test (server render, then `hydrateRoot` with duplicate avatars, asserting no console errors) and an unrelated-re-render test asserting no regeneration
- [ ] 4.5 Run the React tests against React 18 and 19 (overrides in a CI matrix) and verify that both pass locally
- [ ] 4.6 Write `packages/chara-react/README.md` with usage examples and verify that the examples compile in the docs test

## 5. Playground (`apps/playground`)

- [ ] 5.1 Scaffold a Vite + React app with `base: '/chara/'` and workspace source aliases; verify that `npm run dev -w playground` serves it
- [ ] 5.2 Build the name input with live Mecha, Critter and Sigil previews on light and dark surfaces, plus size and radius controls; verify by typing and dragging in the browser
- [ ] 5.3 Build the theme-switchable sample gallery and Copy SVG / Copy React snippet buttons with a confirmation; verify that the clipboard contents match `createAvatar`
- [ ] 5.4 Add a Playwright test that renders the golden names in Chromium and asserts they match the Node snapshots, and that the built site works when served from `/chara/`

## 6. CI and release readiness

- [ ] 6.1 Add a GitHub Actions CI workflow (Biome, typecheck, tests with the React 18/19 matrix, build, Playwright); verify with `act` or by pushing the branch to a test remote, once the owner has created the repo
- [ ] 6.2 Add a GitHub Pages deploy workflow for the playground on pushes to `main`
- [ ] 6.3 Add a root `README.md` (what Chara is, the three themes with images, package links, playground link) and verify that `npm pack --dry-run` for both packages lists only `dist`, `README`, `LICENSE` and `package.json`

## Workflow follow-up

- Owner creates `github.com/markwylde/chara`, enables Pages, and publishes `0.1.0` of both packages manually.
- Archive the change once it has been reviewed and merged.
- Track the Terminay integration as a separate change in the Terminay repo.
