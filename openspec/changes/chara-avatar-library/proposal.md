# Proposal

## Why

Apps that show lots of agents or users (Terminay's Bots are the first consumer) usually fall back to a coloured square with an initial, which is hard to tell apart at a glance. GitHub's identicons solve this, but they are a coarse 5×5 pixel grid. Chara turns any name into a unique, deterministic, high-resolution SVG avatar with real character, packaged as a standalone library any project can use.

## What Changes

- New npm-workspaces monorepo, to be hosted at `github.com/markwylde/chara`.
- New package `@markwylde/chara`: a dependency-free TypeScript library that turns a name into an SVG avatar. The same name and theme always give the same image, in Node and in browsers.
- Three built-in themes, ported from the approved proof of concept:
  - **Mecha**: robot faces built from antennas, ears, heads, eyes, mouths and details.
  - **Critter**: soft creatures with a generated body outline, toppers, eyes, mouths and markings.
  - **Sigil**: a mirrored line glyph walked on a 5×5 grid over a gradient, in the spirit of GitHub identicons.
- Output as an SVG string or a `data:` URI, with options for size, corner radius and an accessible title.
- A public way to add custom themes, using the same building blocks as the built-in ones.
- New package `@markwylde/chara-react`: an `<Avatar>` component that renders the same avatar as real React elements, safe for server rendering.
- New Vite + React playground site, deployable to GitHub Pages, for exploring the themes.
- The library has no knowledge of Terminay. Terminay will consume it as an ordinary dependency, in a separate change.

## Capabilities

### New Capabilities

- `avatar-generation`: turning a name into a deterministic SVG avatar. Covers the input normalisation, the three built-in themes, the output formats and options, stability guarantees, and custom themes.
- `react-avatar`: the React component that renders Chara avatars, including its props, accessibility and server-rendering behaviour.
- `playground`: the public demo site that lets people type a name and compare the themes.

### Modified Capabilities

None. This is a new project with no existing specs.

## Impact

- New code only: `packages/chara`, `packages/chara-react` and `apps/playground`, plus root tooling (TypeScript, build, tests, lint, CI).
- New dependencies, all dev-only for the core: TypeScript, tsup, Vitest, Biome, and Vite for the playground. `@markwylde/chara-react` has React ≥18 as a peer dependency.
- The new GitHub repo needs GitHub Pages turned on for the playground. Publishing to npm needs the `@markwylde` scope and an npm token.
- Downstream: Terminay can replace its initial-letter bot squares with `@markwylde/chara-react`. That work belongs in the Terminay repo.
