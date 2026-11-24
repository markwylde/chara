# @markwylde/chara-react

React components for [Chara](https://github.com/markwylde/chara). Chara gives every name a unique SVG avatar that is the same everywhere. The component renders real SVG elements, so there is no `dangerouslySetInnerHTML`, and its markup is identical on the server and the client.

```sh
npm install @markwylde/chara-react
```

React 18 or newer is a peer dependency.

## `<Avatar>`

```tsx
import { Avatar } from '@markwylde/chara-react';

export function BotRow({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar name={name} theme="mecha" size={20} radius={6} />
      <span>{name}</span>
    </div>
  );
}
```

| Prop        | Default   | Meaning                                                                                                      |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `name`      | required  | The name to draw.                                                                                            |
| `theme`     | `'mecha'` | `'mecha'`, `'critter'`, `'sigil'` or a custom theme object.                                                  |
| `size`      | none      | Pixel width and height. Without it the SVG fills its container.                                              |
| `radius`    | `24`      | Corner radius in viewBox units: `0` square, `50` circle.                                                     |
| `title`     | none      | Accessible name. Without it the avatar is `aria-hidden`, which is right when a visible name sits next to it. |
| `idPrefix`  | `''`      | Prefix for the ids inside the SVG.                                                                           |
| `normalize` | `true`    | Ignore case, spacing and Unicode form differences in `name`.                                                 |

Any other SVG prop (`className`, `style`, `onClick`, `aria-label`, `width`, …) goes to the root `<svg>`, and the component forwards its `ref` to that element. A prop you pass wins over the generated value, so `width={64}` overrides `size` for the width only. `viewBox`, `xmlns` and `children` are fixed, and the component ignores them if you pass them.

The avatar is only regenerated when one of the props above changes.

## `useAvatarDataUri`

For places that need an image URL, such as an `<img>`, a CSS background or a favicon:

```tsx
import { useAvatarDataUri } from '@markwylde/chara-react';

export function BotBadge({ name }: { name: string }) {
  const src = useAvatarDataUri(name, { theme: 'sigil', size: 32 });
  return <img src={src} width={32} height={32} alt="" />;
}
```

## Custom themes

Pass any theme made with `defineTheme` from [`@markwylde/chara`](https://www.npmjs.com/package/@markwylde/chara):

```tsx
import { defineTheme } from '@markwylde/chara';
import { Avatar } from '@markwylde/chara-react';

const dot = defineTheme({
  id: 'dot',
  draw: ({ rand, hsl, el }) => ({
    background: hsl(rand.int(360), 60, 55),
    content: [el('circle', { cx: 50, cy: 50, r: 18, fill: '#fff' })],
  }),
});

export const Example = () => <Avatar name="Claudette" theme={dot} size={48} title="Claudette" />;
```

## Licence

MIT
