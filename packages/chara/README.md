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

An empty name (after normalisation) is seeded as `"chara"`.

### Putting many avatars on one page

Every id in an avatar comes from the theme, the name and the radius. The same avatar repeated on a page reuses the same ids, with identical content, which renders correctly and hydrates cleanly. Different avatars, including the same name at different radii, get different ids. If you need full isolation, pass an `idPrefix`.

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

### Safety

Every avatar is checked against an allowlist before it is returned, whichever theme drew it. Only basic shapes, groups, gradients, clip paths and `title` are allowed, with presentation attributes (`ALLOWED_TAGS`, `ALLOWED_ATTRIBUTES`). URL values must use the exact `url(#id)` form and point at an ID inside the same avatar; obfuscated CSS URLs and namespace overrides are rejected. Scripts, event handlers, `style`, `href` and `foreignObject` throw a `CharaSafetyError`. This validates generated SVG content; custom theme draw functions are JavaScript and must be trusted by the host application.

## Stability

The output for a given name, theme and options changes only in a semver-breaking release: a new minor version during 0.x, and a new major version from 1.0.0. This covers the drawing, the normalisation, the ids and the serialisation. Golden snapshots in the test suite lock this. A new look ships as a new theme rather than a change to an existing one.

## Licence

MIT
