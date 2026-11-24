# Design

## Context

The core renders a theme's `draw(ctx)` result inside a fixed frame: a rounded clip and a background rect. Output is deterministic and locked by 72 golden SVGs; the stability rule says tile output only changes in a semver-breaking release. Every tree passes an allowlist (`validateTree`) that forbids `style`, text outside `title`, and non-local URLs. The React package renders the same tree with `createElement`.

The approved proof of concept is in `reference/poc-generator.ts` (drawing) and `reference/poc-page.html` (the animation CSS, below the "what the library would ship" comment).

## Goals / Non-Goals

**Goals**

- Standalone characters that are the same character as the tile for the same name (same random sequence, same colours and parts).
- Animation that needs no host stylesheet and no JavaScript, and works inline, in React and in `<img>`.
- Tile output stays byte-identical.

**Non-Goals**

- Animating the tile variant. `animated` with `variant: "tile"` is an error.
- A JavaScript animation runtime, SMIL, or per-frame control.
- Transitions between states (a state change simply switches loops).
- Terminay integration.

## Decisions

### Options

`variant?: 'tile' | 'standalone'` (default `tile`), `animated?: boolean` (default false), `state?: 'idle' | 'thinking' | 'working' | 'success' | 'error' | 'sleeping'` (default `idle`), `mono?: boolean` (default false).

- Unknown `variant` or `state` values throw `TypeError`.
- `animated: true` with the tile variant throws `TypeError`. Silently ignoring it would hide a mistake.
- `state` without `animated` is validated but has no effect: poses such as closed eyes are CSS, so a still avatar is always the neutral pose.
- `radius` is ignored for standalone (there is no frame).

### Themes provide a second drawing

`Theme` gains two optional members: `character(ctx): { content: SvgNode[] }` and `animation: string` (CSS). Each built-in theme is refactored so one internal function makes every random call in the existing order and returns named parts; `draw` assembles the tile exactly as today and `character` assembles the standalone figure. This is what guarantees "same character": both consume the same random sequence. Extra random values needed only by standalone (none today) must be drawn after all existing calls.

A custom theme without `character` throws `TypeError` when standalone is requested.

Alternative considered: one `draw` that receives `ctx.variant`. Rejected because it makes every custom theme handle a variant it may not support, and makes it easy to perturb the tile's random order.

### Standalone frame

Root `<svg viewBox="0 0 100 100" overflow="visible">` with classes `chara chara-<themeId> chara-d<0-7>`, no clip, no background. `data-state` is present only when animated; `data-mono` when mono. The theme's content is wrapped in one `<g>` below the root, so theme nodes are never direct children of the root. Parts carry classes prefixed `chara-` (`chara-body`, `chara-top`, `chara-eyes`, `chara-look`, `chara-mouth`, `chara-arm`, `chara-shadow`, `chara-glow`, `chara-zzz`, `chara-z`, `chara-line`, `chara-dots`, `chara-ring`). Classes are emitted whether or not the avatar is animated, so switching `animated` on changes only the stylesheet and `data-state`.

Parts that exist only for a state (the sleeping Zs) carry `display="none"` as a presentation attribute; the stylesheet overrides it in that state. A still avatar therefore never shows them, with or without an animated neighbour.

`chara-d<n>` picks one of eight animation delays from a separate seed (`anim:<name>`), so a row of bots does not blink in unison and the theme's random sequence is untouched. The delay is a custom property (`--chara-d`) set on the root by the delay class and applied by one base rule with `animation-delay: var(--chara-d) !important`, so an `animation` shorthand in a state rule cannot reset it. The Zs set `--chara-d` locally for their stagger.

Elements animated by CSS never carry a `transform` attribute (CSS `transform` replaces it); static transforms sit on a wrapper group.

### Animation is an embedded stylesheet

When animated, the frame inserts `<style>` as the first child of the root, containing a generated base (delay classes, the delay rule, the reduced-motion rule) plus the theme's `animation` CSS. The CSS covers every state, selected by `[data-state=…]` on the root, so a consumer can change state by changing one attribute.

- **Scope is enforced, not assumed.** Every selector must start with `.chara-<themeId>[data-state`, and every keyframes name with `chara-<themeId>-`. Because a still avatar has no `data-state`, an animated neighbour's stylesheet cannot touch it, and two themes cannot collide. The base rules the frame generates follow the same shape.
- `@media (prefers-reduced-motion: reduce)` turns all animation off; static poses (closed eyes when sleeping, red on error) still apply.
- Works in `<img>`/data URIs because the stylesheet travels with the SVG. In an image, `overflow` is clipped by the image box, so the success hop may touch the top edge; acceptable.

Alternatives considered: a separate `.css` file the host must import (breaks data URIs, easy to forget); SMIL (state changes need a rebuilt tree, weaker tooling); the `style` attribute (forbidden by the allowlist, and stays forbidden); keeping built-in CSS in a private registry so custom themes cannot supply any (the CommonJS build does not share module state between entry points, so a registry would break `/themes/*` imports).

### Safety

- `class` joins the attribute allowlist with a value pattern of space-separated `[A-Za-z0-9_-]` tokens. `display` is allowed with the value `none`. `overflow` (`visible`), `data-state` and `data-mono` are allowed on the root only.
- `style` joins the tag allowlist in one position only: a direct child of the root. Theme content is always nested in a group, and nested `<svg>` is already forbidden, so only the frame can put one there. Text is allowed inside it. `validateTree` runs on the finished tree, so exported validation accepts everything the library generates.
- Animation CSS is checked by a small parser (`checkAnimationCss(css, themeId)`): a character/substring blacklist (backslash, `<`, `>`, `&`, `url(`, `image(`, `image-set(`, `expression(`), then brace-matched top-level blocks. `@keyframes` names must carry the theme prefix; `@media` blocks are checked recursively; any other at-rule is rejected; every selector in a rule's comma list (split outside parentheses) must begin with the theme's root class plus `[data-state`. Comments are rejected (`/*`) to keep the parser honest. As before, custom theme code itself must be trusted; the checks are a safety net.
- The serializer escapes the stylesheet as text; with `<`, `>` and `&` forbidden, escaping never changes it.

### Mono

`mono` swaps the context's `hsl` helper for one that returns the grey with the same perceived lightness (Rec. 601 luma of the colour it would have produced). Because it is real colour data, not a CSS filter, it works for tiles, images and non-animated output. Built-in themes use only helper colours plus neutral literals (`#fff`, the black shadow), so they are fully grey. For custom themes the guarantee stops at the helper: literal colours pass through. The error state is a shake plus a pulsing `drop-shadow` glow on the body (the owner asked for a red glow instead of the proof of concept's dimmed Critter), with red lights on Mecha and red strokes on Sigil. With mono, each built-in stylesheet replaces that red with a grey under `[data-mono]`.

### Identifiers

The id hash input gains `\0v<variant>` and `\0m` only when they differ from the defaults, so tile ids are unchanged and a tile, a standalone and a mono avatar of the same name never share an id with different content. `animated` and `state` do not affect definitions, so they are not in the hash.

### React

`Avatar` gets `variant`, `animated`, `state`, `mono`. The tree is built with `useMemo` keyed on everything except `state`. On every render the component validates `state` with the core's exported check, then sets `data-state` on top of the memoised tree only when `animated` is true. The renderer maps `class` to `className`, passes `data-*`, `display` and `overflow` through, and renders the library's `<style>` node with its CSS as a text child (never `dangerouslySetInnerHTML`). Caller `className` is merged with the generated classes rather than replacing them, since the animation depends on them. `data-state` and `data-mono` are reserved.

### Playground

A variant switch (Tile / Standalone), an Animate checkbox and a State selector (enabled for standalone), a No colour checkbox, and a size range up to 360. The options passed to avatars and to both copy actions are the *effective* ones: `animated` and `state` are dropped whenever the variant is tile, whatever the disabled controls still hold. Copy SVG and Copy React include only non-default options. The gallery follows the variant and mono settings but is never animated (20 animated SVGs add noise).

## Risks / Trade-offs

- **Tile regression** → the 72 goldens are untouched and run in CI; refactored themes must reproduce them byte for byte.
- **Stylesheet size (about 2–3 KB per animated avatar)** → only present when `animated`; duplicates on one page are identical rules.
- **Standalone look becomes part of the stability rule** → new golden files per theme for standalone and mono; from this release they change only in a breaking release.
- **CSS support** → uses `transform-box: fill-box` and `:is()`, supported by all current browsers. Older engines show a still character.
- **`<style>` inside inline SVG applies document-wide** → mitigated by the `.chara-<theme>` scope and `chara-` keyframe prefix.
