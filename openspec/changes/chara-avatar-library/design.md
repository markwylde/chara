# Design

## Context

The repo holds only the OpenSpec scaffolding: an initial commit on `main`, with this change on `feat/chara-avatar-library` in a git worktree. The approved proof of concept is the reference for how the themes look. It has five themes in one HTML file, of which three are kept, and is saved at `reference/poc.html` in this change. Its generators work, but it has three flaws the library must fix:

- Element IDs come from a global counter, so output depends on call order and breaks SSR hydration.
- It returns markup strings only, which would force React onto `dangerouslySetInnerHTML`.
- Colours use the CSS `hsl()` space syntax, which some SVG consumers don't read.

## Goals / Non-Goals

**Goals:**
- A visually faithful port of the Mecha, Critter and Sigil drawing logic, with deterministic, option-aware IDs.
- A tiny, dependency-free core that tree-shakes per theme.
- One rendering model (a node tree, validated against an allowlist) shared by the string serialiser and React.

**Non-Goals:**
- Raster output (PNG) and a CLI.
- Per-host colour themes. Each avatar carries its own background, designed to read on light and dark surfaces.
- Integration into Terminay. That is a separate change in that repo.
- The Quilt and Orbit themes from the proof of concept.

## Decisions

### Repository layout: npm workspaces
```
packages/chara          @markwylde/chara
packages/chara-react    @markwylde/chara-react
apps/playground         private Vite app
```
This needs no extra tool. pnpm or Turborepo would add little for three packages. The root holds `tsconfig.base.json`, `biome.json` and the CI.

### Build: tsup, ESM + CJS with type declarations
Each package builds ESM (`.js`), CJS (`.cjs`) and `.d.ts`/`.d.cts` files with an `exports` map. CJS stays for older tooling such as Electron main processes. `@markwylde/chara-react` marks `react`, `react/jsx-runtime` and `@markwylde/chara` as external, and a packed-consumer test verifies this. ESM only was rejected: there's a real risk it breaks a CJS consumer, and tsup makes dual output cheap.

### Entry points and tree-shaking
| Import | Contains |
| --- | --- |
| `@markwylde/chara` | everything: `createAvatar*` accepting ids or objects, plus `themes`, `defineTheme` and `serialize` |
| `@markwylde/chara/core` | `createAvatar*` that accept only a theme object; `defineTheme`, `serialize`, types. No registry and no built-in themes |
| `@markwylde/chara/themes/mecha` (and `critter`, `sigil`) | one theme object each |

Single-theme usage is `import { createAvatar } from '@markwylde/chara/core'; import { sigil } from '@markwylde/chara/themes/sigil'`. The root entry is for convenience and includes all three themes, which are small. A test bundles that documented example with esbuild and asserts the metafile has no Mecha or Critter modules. The React package follows the same pattern: `Avatar` accepts an id or an object and imports from the root. The React package's own tree-shaking is not a goal.

### Core API
```ts
type ThemeId = 'mecha' | 'critter' | 'sigil';
interface AvatarOptions {
  theme?: ThemeId | Theme;    // root entry: default 'mecha'; core entry: required Theme
  size?: number;              // finite > 0, else RangeError; omit → viewBox only
  radius?: number;            // clamp 0–50; non-finite/omitted → 24
  title?: string;             // trimmed; empty → decorative
  idPrefix?: string;          // /^[A-Za-z_][A-Za-z0-9_-]*$/ or '' (default)
  normalize?: boolean;        // default true
}
createAvatar(name, opts): string            // SVG markup
createAvatarDataUri(name, opts): string     // data:image/svg+xml;charset=utf-8,<encodeURIComponent>
createAvatarTree(name, opts): SvgNode       // { tag, attrs: Record<string,string>, children: (SvgNode|string)[] }
serialize(node): string
```
`createAvatar` is `serialize(createAvatarTree(...))`, which guarantees that the string and tree outputs agree.

### Theme contract
```ts
interface Theme { id: string; draw(ctx: ThemeContext): ThemeDrawing }
interface ThemeDrawing { background: string; content: SvgNode[] } // background = colour or ctx.ref(id)
interface ThemeContext {
  rand: { f(): number; int(n): number; pick<T>(a: readonly T[]): T; range(lo, hi): number; chance(p): boolean };
  hsl(h, s, l): string;              // → '#rrggbb'
  id(local: string): string;         // deterministic document ID
  ref(id: string): string;           // → 'url(#id)'
  def(node: SvgNode): void;          // register a gradient/clipPath into <defs>
  el(tag, attrs?, ...children): SvgNode;
  mirrorX(nodes: SvgNode[]): SvgNode;
  smoothClosedPath(points: [number, number][]): string;
  f1(n: number): string;             // 1-decimal formatting
}
defineTheme({ id, draw }): Theme      // validates id /^[a-z][a-z0-9-]*$/
```
The core builds the frame around the theme's output:

```
svg (xmlns, viewBox, width/height?, role/aria-hidden)
├── title?
├── defs
│   ├── clipPath id=frame (rect, rx = radius)
│   └── theme defs
└── g clip-path=frame
    ├── rect (fill = background)
    └── content
```

### Safety: allowlist validation
After `draw()` the core walks the tree and checks every node against an exported allowlist:
- **Tags:** `svg g defs clipPath linearGradient radialGradient stop rect circle ellipse path line polyline polygon title`.
- **Attributes:** geometry, paint, stroke, opacity, transform, gradient and `id`/`clip-path`. No `on*`, `style`, `href`, `xlink:href` or `foreignObject`.
- **URL values:** any attribute value containing `url(` must be exactly `url(#<id>)`, where `<id>` is defined in this document.
- **Text:** only allowed inside `title`.

A violation throws a `CharaSafetyError` that names the offending tag, attribute or value. This runs for built-in themes too (it costs very little), so the guarantee holds for every output. The same allowlist drives React's attribute-name mapping, so the two can't drift apart.

The alternative was to declare custom themes trusted and outside the guarantee. That was rejected: Terminay may load avatars in privileged contexts, and a hard guarantee is simpler to reason about.

### Seeding and hashing: cyrb128 → sfc32, as in the proof of concept
The seed string is `` `${theme.id}:${seedName}` ``. Both functions are integer-only (`Math.imul`, shifts), so they are bit-identical across engines. The only floats are the conversion to `[0,1)` and the geometry and colour derived from it. All coordinates go through `f1`, and colours through integer RGB rounding, so engine float differences can't reach the output. A Chromium-vs-Node golden test guards this. A stronger hash (WebCrypto SHA-256) was rejected because it is asynchronous in browsers.

### Deterministic, option-aware IDs
`ctx.id(local)` returns `` `${idPrefix}c${h}-${local}` ``. `h` is the first 64 bits, in base 36, of cyrb128 over `` `${theme.id}\0${seedName}\0r${radius}` ``, which is everything that changes a definition. Size and title don't change defs, so they don't change IDs. The same avatar repeated on a page defines identical content under the same IDs, which renders correctly and hydrates stably. Different radii get different IDs. A 64-bit space makes clashes between different avatars in one document negligible, and `idPrefix` is the escape hatch for full isolation.

React's `useId` was rejected because it would make core and React output differ.

### Colours as hex
`ctx.hsl()` converts to `#rrggbb`. The CSS space syntax `hsl(h s% l%)` fails in librsvg and older resvg, and in favicon `data:` URIs. Opacity stays a separate attribute.

### Porting fidelity
Themes keep the proof of concept's exact order of random calls, so the shipped avatars match what was approved, apart from the hex colour conversion. Fidelity is checked visually by rendering the 24 proof-of-concept names next to `reference/poc.html` in the playground during development. Byte equality isn't possible, because IDs and the colour format change.

Sigil keeps the proof of concept's 30-attempt retry. If all attempts fail the off-centre rule, it draws a fixed fallback walk: (2,0)→(1,1)→(0,2)→(1,3)→(2,4), mirrored. The walk logic accepts an injected random source, so a test can force the exhaustion path.

### Normalisation
NFC, then trim, then collapse `\s+` to one space, then `toLowerCase()`. `toLowerCase` is used rather than `toLocaleLowerCase` so the output never depends on the host locale. If the result is empty, the seed is `"chara"`. With `normalize: false` the raw string is used, and an empty raw string still falls back to `"chara"`.

### Distinctness testing
The 10k collision test generates names, deduplicates them by normalised form, renders each theme, and canonicalises each SVG by replacing every ID and `url(#…)` reference with its first-seen ordinal. It then asserts that all the canonical strings are unique.

### React: render the node tree
`Avatar` memoises `createAvatarTree` on `(name, theme, size, radius, title, idPrefix, normalize)` and maps nodes to `React.createElement`, using the allowlist's attribute table (`stroke-width` → `strokeWidth`, `clip-path` → `clipPath`, and so on). Root props are merged in the order generated attributes, then caller props, then reserved props: `viewBox` and `xmlns` are reasserted, and `children` and `dangerouslySetInnerHTML` are dropped. The component uses `forwardRef` so it works on React 18 and 19. Equality with core output is tested by parsing both into DOM trees and comparing elements, attributes and text. React and the serialiser can legitimately differ in self-closing syntax. `useAvatarDataUri` wraps `createAvatarDataUri` in `useMemo`.

### Testing: Vitest
- **Core:** normalisation; seeded random; serialiser escaping; colour and geometry helpers; frame and options (including size and radius edge cases and the title and prefix rules); safety rejections; ID behaviour, including a mixed-radius inline document; golden snapshots (`toMatchFileSnapshot`, one `.svg` per theme and name, committed so they can be reviewed as images); collisions; Sigil properties and fallback; the bundle check.
- **Packed consumer:** a script `npm pack`s both packages into a temporary project and checks:
  - ESM import, CJS require and the `/core` and `/themes/*` subpaths
  - `tsc` against the declarations
  - that the React build contains no React or core source
- **React:** `@testing-library/react`; `renderToString` with `hydrateRoot` to catch hydration errors; a CI matrix on React 18 and 19.
- **Browser:** Playwright against the playground (Chromium) for the cross-runtime golden check, sub-path serving and clipboard behaviour.

### Lint and format: Biome
One fast tool for both.

### Playground
A Vite + React app with `base: '/chara/'`. In development it imports the workspace packages from source through Vite aliases, so edits show instantly. Published entry points are covered by the packed-consumer test instead. Copy React builds the snippet with `JSON.stringify(name)` inside a JSX expression container, so quotes, braces and newlines are safe. If `navigator.clipboard` rejects, the page selects the text in a read-only textarea and shows a failure message. The visual style follows the approved proof-of-concept page. A GitHub Actions workflow deploys it to Pages.

### CI
GitHub Actions runs, on push and PR:
- Biome
- typecheck
- unit tests, with React 18 and 19 as a matrix
- build
- the packed-consumer test
- Playwright

A separate Pages workflow deploys the playground.

## Risks / Trade-offs

- [The output contract makes any drawing tweak a breaking release] → Golden snapshots make every change visible in review. A new look ships as a new theme id instead of a change to an existing one.
- [Engine float differences changing output] → Integer hashing, 1-decimal coordinates and hex colours, plus the Chromium-vs-Node golden test.
- [The allowlist is too tight for a creative custom theme] → The allowlist is exported and documented. Adding a tag or attribute is a minor, non-breaking change.
- [Hex conversion shifting colours slightly from the proof of concept] → Integer RGB rounding is visually indistinguishable. Checked side by side in the playground.
- [The `@markwylde` scope needs npm access] → Publishing is a manual step for the owner. The packages build and pack without it.

## Migration Plan

This is a new project, so there is nothing to migrate. The first release is `0.1.0`, published by hand with `npm publish --access public` from each package. Under the stability rule, any output change during 0.x needs a new minor version, and from 1.0.0 a new major version.

## Open Questions

- Licence: assumed MIT unless the owner says otherwise.
- Whether to automate npm publishing later (for example, Changesets with provenance). It doesn't affect the code.
