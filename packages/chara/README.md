# @markwylde/chara

Chara turns any name into a unique SVG avatar. The same name always gives the same avatar, in Node and in browsers, so you never have to store an image.

```sh
npm install @markwylde/chara
```

```ts
import { createAvatar } from '@markwylde/chara';

const svg: string = createAvatar('Claudette', { theme: 'sigil', size: 40 });
```

There are three built-in themes:

| Theme             | What it draws                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `mecha` (default) | Robot faces built from antennas, ears, heads, eyes, mouths and details.                           |
| `critter`         | Soft creatures with a generated body outline, rising from the bottom edge.                        |
| `sigil`           | A mirrored line glyph walked on a 5×5 grid over a gradient, in the spirit of GitHub's identicons. |

Try them in the [playground](https://markwylde.github.io/chara/).

## API

```ts
import { createAvatar, createAvatarDataUri, createAvatarTree, serialize } from '@markwylde/chara';

const markup = createAvatar('Imagine', { theme: 'critter' });
const src = createAvatarDataUri('Imagine', { theme: 'critter' }); // data:image/svg+xml;charset=utf-8,...
const tree = createAvatarTree('Imagine', { theme: 'critter' }); // { tag, attrs, children }
console.log(serialize(tree) === markup); // true
console.log(src.length);
```

- `createAvatar(name, options?)` returns SVG markup.
- `createAvatarDataUri(name, options?)` returns the same SVG as a `data:` URI for an `<img>` `src`, a CSS background or a favicon.
- `createAvatarTree(name, options?)` returns the SVG as plain nodes, which is what the other two are built from. Renderers such as [`@markwylde/chara-react`](https://www.npmjs.com/package/@markwylde/chara-react) use it to build real elements without parsing markup.

### Options

| Option      | Default   | Meaning                                                                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`     | `'mecha'` | A built-in theme id or a theme object. Unknown ids throw an error that lists the valid ones.                                                                  |
| `size`      | none      | Pixel width and height. It must be a finite number above 0, or a `RangeError` is thrown. Without it the SVG has only a `viewBox` and scales to its container. |
| `radius`    | `24`      | Corner radius in viewBox units: `0` is a square and `50` a circle. Values outside 0–50 are clamped, and non-finite values use the default.                    |
| `title`     | none      | Accessible name. With a title the SVG gets `role="img"` and a `<title>`. Without one, or with a blank one, it is `aria-hidden="true"`.                        |
| `idPrefix`  | `''`      | Prefix for every id inside the SVG. It must start with a letter or underscore, then use letters, digits, `-` or `_`.                                          |
| `normalize` | `true`    | Applies NFC, trims, collapses whitespace and lowercases the name before seeding, so `"Claudette"` and `" claudette "` match.                                  |

| `variant` | `'tile'` | `'tile'` is the character inside a rounded, coloured square. `'standalone'` is the whole character with no background; `radius` is then ignored. |
| `animated` | `false` | Animates a standalone avatar. Needs `variant: 'standalone'`, or a `TypeError` is thrown. |
| `state` | `'idle'` | What an animated avatar is doing: `idle`, `thinking`, `working`, `success`, `error` or `sleeping`. It has no effect unless `animated` is set. |
| `mono` | `false` | Draws the avatar in greys only. It works with both variants and every state. |

An empty name (after normalisation) is seeded as `"chara"`.

### Standalone, animated characters

```ts
import { createAvatar } from '@markwylde/chara';

// The whole character, with a transparent background, at any size
const hero = createAvatar('Claudette', { theme: 'critter', variant: 'standalone', size: 240 });

// Animated, and showing what the bot is doing
const busy = createAvatar('Claudette', {
  theme: 'critter',
  variant: 'standalone',
  animated: true,
  state: 'working',
});

// Offline: no colour, asleep
const away = createAvatar('Claudette', {
  variant: 'standalone',
  animated: true,
  state: 'sleeping',
  mono: true,
});
```

A name gives the same character in both variants: the standalone one is built from the same parts as the tile.

The animation is CSS inside the SVG, so it needs no stylesheet or script from your page, and it also runs when the SVG is used as an image. It contains the rules for every state. To change state on an inline SVG, set the root's `data-state` attribute; nothing needs to be regenerated. Animated avatars stand still for people who have asked their system for reduced motion.

Each name starts its loops at a slightly different point, so a row of bots doesn't blink in unison. In the `error` state the character keeps its colours and gains a pulsing red glow.

### Putting many avatars on one page

Every id in an avatar comes from the theme, the name, the radius, the variant and `mono`. The same avatar repeated on a page reuses the same ids, with identical content, which renders correctly and hydrates cleanly. Different avatars, including the same name at different radii, get different ids. If you need full isolation, pass an `idPrefix`.

## Smaller bundles

The root entry includes all three themes. To ship one theme only, use the `core` entry, which has no theme registry, together with a theme subpath:

```ts
import { createAvatar } from '@markwylde/chara/core';
import { sigil } from '@markwylde/chara/themes/sigil';

const svg = createAvatar('Infrado', { theme: sigil });
console.log(svg);
```

## Custom themes

A theme has an id (lowercase letters, digits and hyphens) and a `draw` function. `draw` receives a seeded random source and drawing helpers, and returns a background and content. Chara adds the frame, clip, size, title and ids, so custom themes get every option for free.

```ts
import { createAvatar, defineTheme } from '@markwylde/chara';

const bubbles = defineTheme({
  id: 'bubbles',
  draw({ rand, hsl, el, id, ref, def }) {
    const hue = rand.int(360);
    const gradient = id('bg');
    def(
      el(
        'linearGradient',
        { id: gradient, x1: 0, y1: 0, x2: 1, y2: 1 },
        el('stop', { offset: 0, 'stop-color': hsl(hue, 70, 60) }),
        el('stop', { offset: 1, 'stop-color': hsl(hue + 40, 70, 35) }),
      ),
    );
    const content = Array.from({ length: 3 + rand.int(4) }, () =>
      el('circle', {
        cx: rand.range(20, 80),
        cy: rand.range(20, 80),
        r: rand.range(6, 18),
        fill: '#fff',
        opacity: 0.7,
      }),
    );
    return { background: ref(gradient), content };
  },
});

const svg = createAvatar('Personelly', { theme: bubbles, radius: 50 });
console.log(svg);
```

Call `rand` in a fixed order, and don't use `Math.random`, dates or other outside state, so output stays deterministic.
Use `ctx.id(local)` for every ID a theme defines, and `ctx.ref(id)` for references. Hard-coded IDs are rejected so custom avatars remain isolated when inlined together.

### Standalone and animated custom themes

A theme can also define `character`, which draws the standalone figure and returns only `content`, and `animation`, a CSS string for animated avatars.

```ts
import { createAvatar, defineTheme } from '@markwylde/chara';

const orb = defineTheme({
  id: 'orb',
  draw: ({ rand, hsl, el }) => ({
    background: hsl(rand.int(360), 60, 85),
    content: [el('circle', { cx: 50, cy: 50, r: 30, fill: '#333' })],
  }),
  character: ({ rand, hsl, el }) => ({
    content: [el('circle', { class: 'orb-ball', cx: 50, cy: 50, r: 30, fill: hsl(rand.int(360), 70, 55) })],
  }),
  animation:
    '.chara-orb[data-state] .orb-ball{animation:chara-orb-pulse 3s ease-in-out infinite}' +
    '.chara-orb[data-state=working] .orb-ball{animation-duration:.6s}' +
    '@keyframes chara-orb-pulse{50%{opacity:.5}}',
});

createAvatar('Claudette', { theme: orb, variant: 'standalone', animated: true, state: 'working' });
```

Without `character`, asking for the standalone variant throws a `TypeError`; without `animation`, so does `animated`. Give parts a `class` to animate them. Every selector in the CSS must start with `.chara-<theme id>[data-state`, and every keyframes name with `chara-<theme id>-`. That scope is enforced, so one theme's animation can't affect your page, another theme, or a still avatar. `mono` turns colours from `ctx.hsl` grey; literal colours and colours in your CSS are yours to handle (the root has a `data-mono` attribute to select on).

### Safety

Every avatar is checked against an allowlist before it is returned, whichever theme drew it. Only basic shapes, groups, gradients, clip paths and `title` are allowed, with presentation attributes (`ALLOWED_TAGS`, `ALLOWED_ATTRIBUTES`). URL values must use the exact `url(#id)` form and point at an ID inside the same avatar; obfuscated CSS URLs and namespace overrides are rejected. Scripts, event handlers, the `style` attribute, `href` and `foreignObject` throw a `CharaSafetyError`. Themes can't add a stylesheet: the only `<style>` element is the one the library writes for an animated avatar, and its CSS is checked first (`checkAnimationCss`). That check rejects escapes, `url()` and other ways of loading something external, any at-rule except `@keyframes` and `@media`, and any selector outside the theme's own scope. This validates generated SVG content; custom theme draw functions are JavaScript and must be trusted by the host application.

## Stability

The output for a given name, theme and options changes only in a semver-breaking release: a new minor version during 0.x, and a new major version from 1.0.0. This covers the drawing, the normalisation, the ids and the serialisation. Golden snapshots in the test suite lock this. A new look ships as a new theme rather than a change to an existing one.

## Licence

MIT
