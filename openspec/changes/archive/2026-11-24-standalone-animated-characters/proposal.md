# Proposal

## Why

Chara avatars are small tiles: a character clipped inside a coloured, rounded square. Terminay (and other consumers) also want to show a bot large, on its own, with no background, and alive: idling, thinking, working, succeeding, failing or sleeping. Today that is impossible. Critter is cut off by the tile's bottom edge, Sigil's near-white ink disappears on a light page, and nothing moves.

A proof of concept (`reference/`) was reviewed and approved by the owner, including the look of each standalone character, six animation states and a no-colour option.

## What Changes

- Add a `variant` option: `"tile"` (default, today's output, byte-identical) or `"standalone"`, which draws the same character for a name with no background and no clip, as a whole figure:
  - **Mecha**: the head hovers over a ground shadow. The tile colour becomes a sticker outline so a light shell is visible on a light page.
  - **Critter**: a whole body with feet and arms instead of rising from the bottom edge, plus a ground shadow.
  - **Sigil**: the glyph is stroked with the gradient instead of white ink.
- Add an `animated` option for standalone avatars, with a `state` option: `idle` (default), `thinking`, `working`, `success`, `error`, `sleeping`. Animation is CSS carried inside the SVG, so it works inline, in React and as an image, and it respects `prefers-reduced-motion`.
- Add a `mono` option (no colour) that draws any avatar, tile or standalone, in greys. It combines with every state.
- Let custom themes opt in by defining a `character` drawing and, optionally, animation CSS, which is checked before use.
- React `Avatar` and `useAvatarDataUri` accept `variant`, `animated`, `state` and `mono`. Changing only `state` changes one attribute, so animations do not restart from a re-mount.
- Playground: controls for variant, animation, state and no colour; larger sizes; copy output reflects the new options.

Nothing is removed. Existing tile output does not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `avatar-generation`: adds the standalone variant, animation states, the mono option, the custom-theme hooks for them, and the safety rules for classes and library-emitted stylesheets.
- `react-avatar`: adds the new props and the rule that a state change does not rebuild the avatar.
- `playground`: adds controls and copy output for the new options.

## Impact

- `packages/chara`: `render.ts`, `theme.ts`, `safety.ts`, `color.ts`, all three themes, a new animation module, tests and new golden files, README.
- `packages/chara-react`: `Avatar`, `useAvatarDataUri`, renderer support for `<style>` and `class`, tests, README.
- `apps/playground`: `App.tsx`, `snippet.ts`, styles, unit and e2e tests.
- No new dependencies. Additive API: no breaking change, and the 72 existing golden SVGs must stay byte-identical.
