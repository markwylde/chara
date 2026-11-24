## Context

The playground is a static Vite + React page that uses the two published packages. This change only rearranges and extends it.

## Goals / Non-Goals

**Goals:** a demo that shows off standalone animated characters first, exposes every library option, and lets visitors judge the avatars at real interface sizes.

**Non-Goals:** new library features, a router, or any persisted state beyond the URL and the page appearance.

## Decisions

- **One settings object, mirrored to the query string.** `src/settings.ts` holds the type, defaults, limits and `toQuery`/`fromQuery`. Only non-default values are written, with short keys, and everything read back is validated and clamped, so a hand-edited link cannot break the page. `history.replaceState` is used so typing does not fill the back history.
- **Defaults show the new work:** Critter, standalone, animated, 200px. Tiles are one click away.
- **The state picker always previews standalone, animated avatars.** It is the demonstration of the states, so choosing one turns on standalone and animation rather than being disabled for tiles. The Animate and Cycle switches stay disabled for tiles, which matches the library (`animated` needs `variant: "standalone"`).
- **What follows the studio:** the stage, app examples and gallery use the same effective options, so tiles are never given animation or state. With "Mixed statuses" on, each example bot has a fixed state and the offline one is drawn without colour; the visitor's own name always follows the studio.
- **An invalid id prefix is not passed to the library** (it would throw). The field is marked invalid and explains the rule.
- **Copy confirmation timers only clear their own message,** so a quick second copy is not wiped by the first one's timer.

## Risks / Trade-offs

- 80 animated inline SVGs is a lot of DOM (roughly 700 KB for Mecha) → the default is 20, and 80 is opt-in.
- Existing deep links do not exist, so changing the layout breaks nothing external.
