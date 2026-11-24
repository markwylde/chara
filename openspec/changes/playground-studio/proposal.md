## Why

The playground showed three near-identical theme sheets with a handful of controls. The proof-of-concept page made for the standalone characters was a better demo: one large character, every state visible, and room to play. Visitors could not try the avatars at realistic sizes inside app chrome, and the gallery stayed still even with animation on.

## What Changes

- Replace the three theme sheets with a single **studio**: theme tabs that preview the current name in each theme, one large stage, a state picker that previews all six states, and the code for the current avatar underneath.
- Add an options panel with many more settings: a random name, size and radius presets, cycling through states, backdrops (light and dark together, light, dark, transparent, a custom colour), an accessible title, an id prefix and exact-name matching.
- Add an **In your app** section (sidebar, chat thread, profile card) with its own icon size, surface and per-bot statuses.
- The gallery and the app examples now animate when animation is on. The gallery has its own size and count, and picking a name loads it into the studio.
- Output gains a JavaScript snippet, a data URI and an SVG download next to the SVG and React snippet.
- Every setting is kept in the URL, so a configuration can be shared as a link. The page can be forced light or dark.
- Picking a state while tiles are selected switches to the standalone variant and turns animation on, instead of the state control being disabled.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playground`: new layout, more options, animated gallery and app examples, more output formats, shareable links.

## Impact

- `apps/playground` only: `src/App.tsx`, new `src/components/`, `src/settings.ts`, `src/snippet.ts`, `src/styles.css`, tests.
- No change to `@markwylde/chara` or `@markwylde/chara-react`.
