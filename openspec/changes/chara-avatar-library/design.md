# Design

## Context

The repo has OpenSpec scaffolding and nothing else, including no commits. The approved proof of concept (five themes in one HTML file, three kept; saved at `reference/poc.html` in this change) is the reference for how the themes look. Its generators work, but it has three flaws that the library must fix:

- Element IDs come from a global counter, so the output depends on call order and breaks SSR hydration.
- It returns markup strings only, so React would need `dangerouslySetInnerHTML`.
- Colours use the CSS `hsl()` space syntax, which some SVG consumers don't read.

## Goals / Non-Goals

**Goals:**
- Pixel-identical port of the Mecha, Critter and Sigil drawing logic, with deterministic IDs.
- A tiny, dependency-free core that tree-shakes per theme.
- One rendering model (a node tree) shared by the string serialiser and React.

**Non-Goals:**
- Raster output (PNG) and a CLI. Consumers can rasterise the SVG themselves.
- Per-host colour themes (light or dark variants of an avatar). Each avatar carries its own background and is designed to read on either surface.
- Integration into Terminay. That is a separate change in that repo.
- The Quilt and Orbit themes from the proof of concept.

## Decisions

### Repository layout: npm workspaces
```
packages/chara          @markwylde/chara
packages/chara-react    @markwylde/chara-react
apps/playground         private Vite app
```
This needs no extra tool. pnpm or Turborepo would add little for three packages. The root holds the shared `tsconfig.base.json`, the Biome config and the CI.

### Build: tsup, ESM + CJS with type declarations
Each package builds `dist/index.js` (ESM), `dist/index.cjs` and `.d.ts` files, with an `exports` map. CJS stays for older tooling such as Electron main processes. The core has `sideEffects: false`, and each theme also gets a subpath export (`@markwylde/chara/themes/sigil`) so a bundle only carries the themes it imports.

The alternative was ESM only. That is simpler, but there's a real risk it breaks a CJS consumer, and tsup makes dual output cheap.

### Core API
```ts
type ThemeId = 'mecha' | 'critter' | 'sigil';
interface AvatarOptions {
  theme?: ThemeId | Theme;    // default 'mecha'
  size?: number;              // omit → viewBox only
  radius?: number;            // 0–50, default 24
  title?: string;             // accessible name; omit → aria-hidden
  idPrefix?: string;          // default ''
  normalize?: boolean;        // default true
}
createAvatar(name, opts): string            // SVG markup
createAvatarDataUri(name, opts): string     // data:image/svg+xml;utf8,…
createAvatarTree(name, opts): SvgNode       // { tag, attrs, children }
serialize(node): string
defineTheme({ id, draw }): Theme
themes: { mecha, critter, sigil }
```
`createAvatar` is `serialize(createAvatarTree(...))`, which guarantees the string and tree outputs agree.

### Themes draw nodes, not strings
A theme's `draw(ctx)` returns `SvgNode[]` for the content inside the clip. `ctx` provides:
- `rand`: `f`, `int`, `pick`, `range`, `chance`
- `hsl(h, s, l)`: returns a hex colour string
- `id(local)`: makes a deterministic ID
- small helpers: `el(tag, attrs, ...children)`, `mirrorX(nodes)`, `smoothClosedPath(points)`, `f1(n)`
- `defs(...nodes)`: registers gradients and clip paths

The core wraps the theme's content in the frame:
- the root `svg` with `viewBox`, size, ARIA attributes and the title
- a rounded-rect `clipPath`
- the background, which the theme returns as a fill string or a gradient node

Custom themes use exactly this context, which is what makes `defineTheme` honest.

### Seeding and hashing: cyrb128 → sfc32, as in the proof of concept
The seed string is `` `${theme.id}:${normalizedName}` ``. Both functions are integer-only (`Math.imul`, shifts), so they are bit-identical across JS engines. The only floating-point work is turning the `uint32` into `[0,1)` and then into coordinates and colours. Coordinates are rounded with `f1` (1 decimal place), and colours are converted to hex with integer rounding, so engine-level float differences can't reach the output.

The alternative was a stronger hash such as SHA-256 via WebCrypto. It is asynchronous in browsers and overkill for this. cyrb128 is non-cryptographic, but avatars are not a security boundary.

### Deterministic IDs
`id(local)` returns `` `${idPrefix}chara-${themeId}-${h}-${local}` ``, where `h` is the first 32 bits of the seed hash in base 36. The same avatar always uses the same IDs, so duplicates on a page define identical content, which renders correctly. Hydration is stable because nothing depends on `useId` or a counter.

React's `useId` was rejected because it makes the core and React outputs differ. The risk of two different names sharing a 32-bit hash prefix in one document is negligible. `idPrefix` is the escape hatch.

### Colours as hex
`ctx.hsl()` converts to `#rrggbb` with integer rounding. The proof of concept's `hsl(h s% l%)` space syntax is not supported by some SVG rasterisers (librsvg, older resvg) or in `data:` URIs used as favicons. Hex keeps the proof of concept's look while being universally readable. Opacity stays a separate attribute.

### Porting fidelity
The themes keep the proof of concept's order of random calls exactly, so that the playground matches what the user approved. Literal `#fff` stays. Ports are checked by rendering the proof of concept's names (`Claudette`, `Imagine`, `Infrado`, `Personelly`, plus the 20 sample names) side by side in the playground during development. They are not checked byte for byte, because IDs and the colour format change.

### Normalisation
Names go through NFC, then trim, then whitespace collapse, then `toLowerCase()`; empty becomes `"chara"`. `toLowerCase` is used rather than `toLocaleLowerCase` so the output never depends on the host locale (Turkish dotless i).

### React: render the node tree
`Avatar` memoises `createAvatarTree` on `(name, theme, radius, size, title, idPrefix, normalize)` and recursively maps nodes to `React.createElement`. A fixed table converts SVG attributes to camelCase where React needs it (`stroke-width` → `strokeWidth`, `clip-path` → `clipPath`, and so on); themes may only use attributes in that table. The component uses `forwardRef` so it works on React 18 as well as 19. `useAvatarDataUri` wraps `createAvatarDataUri` in `useMemo`.

### Testing: Vitest
- **Core:** determinism and order independence; normalisation; the XML well-formedness check with `@xmldom/xmldom` (a dev dependency); the 10k-name collision test; the Sigil off-centre stroke property; radius clamping; title escaping; ID prefix; tree vs string equality; golden snapshots (`toMatchFileSnapshot`, one `.svg` per theme × name, committed so diffs can be read as images).
- **Cross-runtime check:** a Vitest browser-mode or `happy-dom` run isn't a real engine check. Instead, one Playwright test in the playground renders the golden names in Chromium and compares them with the Node snapshots.
- **React:** `@testing-library/react` plus `renderToString` with `hydrateRoot` for the hydration test, run in a CI matrix on React 18 and 19.

### Lint and format: Biome
One fast tool for both, with no plugin sprawl.

### Playground
A Vite + React app with `base: '/chara/'`. It imports the workspace packages from source through Vite aliases, so edits show instantly. It is deployed by a GitHub Actions workflow to Pages on pushes to `main`. Its visual style follows the approved proof-of-concept page.

### CI
GitHub Actions on push and PR runs install, Biome check, typecheck, test (with the React 18/19 matrix), and build. A separate Pages workflow deploys the playground.

## Risks / Trade-offs

- [The output contract makes any drawing tweak a major version] → Golden snapshots make every change visible in review. A new look ships as a new theme id instead of a change to an existing one.
- [Floating-point differences between engines changing output] → Integer hashing, plus 1-decimal rounding of all coordinates and hex colours, plus the Chromium-vs-Node golden test.
- [Hex conversion shifting colours slightly from the proof of concept] → Integer RGB rounding is visually indistinguishable. Checked side by side in the playground.
- [The attribute table missing an attribute a custom theme uses] → `defineTheme` content is validated in development builds and warns about unknown attributes. The table is exported, so it can be documented.
- [The `@markwylde` scope needs npm org access] → Publishing is a manual step for the owner. The packages build and pack without it.

## Migration Plan

This is a new project, so there is nothing to migrate. Implementation starts with an initial commit on `main`, so that the work can happen in a git worktree on a feature branch. The first npm release is `0.1.0`, done by hand with `npm publish --access public` from each package. The `1.0.0` stability promise starts once Terminay has used it in anger.

## Open Questions

- Licence: assumed MIT unless the owner says otherwise.
- Whether to automate npm publishing later (for example, Changesets with provenance). It doesn't affect the code.
