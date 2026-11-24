# Tasks

## 1. Core plumbing

- [ ] 1.1 Add `variant`, `animated`, `state` and `mono` to the options types with validation (unknown variant/state and animated tile throw `TypeError`); test each error and that `state` without `animated` has no effect
- [ ] 1.2 Add the mono colour helper (grey of equal Rec. 601 luma) and wire it into the theme context when `mono` is set; test known values and that tiles and standalone output contain only greys
- [ ] 1.3 Extend `Theme`/`defineTheme` with optional `character` and `animation`; throw `TypeError` for standalone on a theme without `character`; test both
- [ ] 1.4 Extend the allowlist: `class` with its value pattern, `display="none"`, root-only `overflow="visible"`/`data-state`/`data-mono`, and `style` as a direct child of the root only; test that a theme-emitted `style` element or unsafe class is rejected and that animated output passes `validateTree`
- [ ] 1.5 Implement the animation CSS check (blacklist, allowed at-rules, enforced selector scope and keyframes prefix, including inside `@media` and for every selector in a list); test every rejection scenario in the spec plus a valid sheet
- [ ] 1.6 Implement the standalone frame: no clip or background, root classes including the seeded delay class, `data-state` only when animated, theme content wrapped in a group, generated base CSS (delay classes, `!important` delay rule, reduced motion) plus the checked theme CSS in a root-level stylesheet, ids extended with variant and mono only when non-default; test structure, determinism and that tile ids are unchanged

## 2. Themes

- [ ] 2.1 Refactor Mecha into shared parts with `draw` and `character` (hovering head, sticker outline, shadow, sleeping Zs) and port its animation CSS from the reference; verify the 24 existing goldens are byte-identical
- [ ] 2.2 Do the same for Critter (whole body, feet, arms, shadow, Zs); verify goldens, and test that every coordinate stays inside the canvas
- [ ] 2.3 Do the same for Sigil (gradient strokes with user-space units, mirrored coordinates); verify goldens
- [ ] 2.4 Add golden SVGs for standalone and mono-standalone (24 names × 3 themes each) and for one animated avatar per theme; add the same-character tests (Mecha and Critter: same part shapes and colours; Sigil: same segments), a custom-theme mono test with a literal colour, and a test that state-only parts carry `display="none"`
- [ ] 2.5 Extend the id test to inline tile, standalone and mono versions together with no conflicting ids
- [ ] 2.6 Test that each theme's stylesheet has rules for all six states, is scoped under its theme class, uses only `chara-` keyframe names, has a reduced-motion rule, and applies no non-grey colour under mono
- [ ] 2.7 Check the tree-shaking test still passes (one theme's CSS only) and update `packages/chara/README.md` with the new options, states and custom-theme hooks; README samples must type-check

## 3. React

- [ ] 3.1 Renderer: map `class`, pass `data-*` and `overflow`, render the stylesheet node as text; test parity with core output for standalone, animated and mono in every theme
- [ ] 3.2 `Avatar` props: memoise without `state`, validate `state` every render, apply `data-state` only when animated, merge `className`, reserve `data-state`/`data-mono`; test the state-change scenario (same DOM node, no regeneration), an invalid state on update, no `data-state` on a still avatar, class merging and reserved props
- [ ] 3.3 `useAvatarDataUri` accepts the new options; hydration test for animated duplicates; run on React 18 and 19
- [ ] 3.4 Update `packages/chara-react/README.md`; samples must type-check

## 4. Playground

- [ ] 4.1 Add variant, animate, state and no-colour controls and raise the size limit to 360; state/animate disabled for tiles and dropped from the effective options; gallery never animated; previews stay inside their surfaces at phone width
- [ ] 4.2 Update `buildReactSnippet` and Copy SVG for the new options, omitting defaults; unit-test the snippet builder
- [ ] 4.3 Playwright: standalone has no background, sleeping state applied to sheets but not the gallery, controls disabled for tiles, Standalone→Animate→Tile→copy works with no animation in the output, mono is grey, copy output, a still avatar next to an animated one has no running animations and hidden Zs, two custom themes with the same animation name do not affect each other, golden names show at least two different effective delays before and after a state change, an animated data URI runs in `<img>`, reduced motion stops animation, and no horizontal scroll at maximum size on a 400px viewport

## 5. Release readiness

- [ ] 5.1 Run `npm run check`, `typecheck`, `test`, `build`, `test:packed` and `test:e2e`; all green
- [ ] 5.2 Update the root README with a standalone/animated example
