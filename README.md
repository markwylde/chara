# Chara

Chara turns any name into a unique, high-resolution SVG avatar. The same name always gives the same avatar, in Node and in every browser, so there's nothing to store. It works like GitHub's identicons, but with characters instead of a 5×5 pixel grid.

| Theme                                               | Claudette · Imagine · Infrado · Personelly · Atlas · Biscuit                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mecha**: robot faces built from parts             | <img src="docs/avatars/mecha-claudette.svg" width="56" height="56" alt=""> <img src="docs/avatars/mecha-imagine.svg" width="56" height="56" alt=""> <img src="docs/avatars/mecha-infrado.svg" width="56" height="56" alt=""> <img src="docs/avatars/mecha-personelly.svg" width="56" height="56" alt=""> <img src="docs/avatars/mecha-atlas.svg" width="56" height="56" alt=""> <img src="docs/avatars/mecha-biscuit.svg" width="56" height="56" alt="">             |
| **Critter**: soft creatures with generated outlines | <img src="docs/avatars/critter-claudette.svg" width="56" height="56" alt=""> <img src="docs/avatars/critter-imagine.svg" width="56" height="56" alt=""> <img src="docs/avatars/critter-infrado.svg" width="56" height="56" alt=""> <img src="docs/avatars/critter-personelly.svg" width="56" height="56" alt=""> <img src="docs/avatars/critter-atlas.svg" width="56" height="56" alt=""> <img src="docs/avatars/critter-biscuit.svg" width="56" height="56" alt=""> |
| **Sigil**: mirrored line glyphs, identicon-style    | <img src="docs/avatars/sigil-claudette.svg" width="56" height="56" alt=""> <img src="docs/avatars/sigil-imagine.svg" width="56" height="56" alt=""> <img src="docs/avatars/sigil-infrado.svg" width="56" height="56" alt=""> <img src="docs/avatars/sigil-personelly.svg" width="56" height="56" alt=""> <img src="docs/avatars/sigil-atlas.svg" width="56" height="56" alt=""> <img src="docs/avatars/sigil-biscuit.svg" width="56" height="56" alt="">             |

**[Try it in the playground →](https://markwylde.github.io/chara/)**

## Packages

| Package                                          | What it is                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| [`@markwylde/chara`](packages/chara)             | The generator. It has no dependencies, works in Node and browsers, and outputs an SVG string, a `data:` URI or a node tree. |
| [`@markwylde/chara-react`](packages/chara-react) | An `<Avatar>` component and a `useAvatarDataUri` hook for React 18+.                                                        |

```sh
npm install @markwylde/chara          # or
npm install @markwylde/chara-react
```

```ts
import { createAvatar } from '@markwylde/chara';

const svg = createAvatar('Claudette', { theme: 'critter', size: 40 });
```

```tsx
import { Avatar } from '@markwylde/chara-react';

<Avatar name="Claudette" theme="sigil" size={20} />;

// The whole character, no background, animated
<Avatar name="Claudette" theme="critter" variant="standalone" size={240} animated state="thinking" />;
```

![Claudette in the Mecha, Critter and Sigil themes, in each of the six states and without colour](docs/characters/states.png)

Avatars come as small tiles or as standalone characters with a transparent background. Standalone characters can be animated (`idle`, `thinking`, `working`, `success`, `error`, `sleeping`) and any avatar can be drawn without colour.

Every avatar is checked against an SVG allowlist, so even a custom theme can't produce scripts or external references. Output only changes in a semver-breaking release. See each package's README for the full API.

## Development

This is an npm workspaces monorepo: `packages/chara`, `packages/chara-react` and `apps/playground`. It needs Node 22.12 or newer.

```sh
npm install
npm run check        # Biome lint and format check
npm run typecheck
npm test             # unit tests for every workspace
npm run test:packed  # packs both packages and tests them in a fresh project
npm run test:e2e     # builds, then runs the playground's Playwright tests in Chromium
npm run dev -w playground
```

To run the React tests against React 18, run `node scripts/use-react.mjs 18` and then `CHARA_REACT=18 npm test -w @markwylde/chara-react`.

Golden snapshots of every theme live in `packages/chara/test/__golden__`. If a change alters them, it is a breaking change to the output (see Stability in the core README).

### Releasing

Releases are automatic. On every push to `main`, the `Release` workflow runs every check, then [semantic-release](https://semantic-release.gitbook.io/) reads the commits since the last `v*` tag. If any call for a release, it picks the version, updates `CHANGELOG.md` and both package versions, commits that back to `main` with a tag, publishes `@markwylde/chara` and then `@markwylde/chara-react` to npm, and creates a GitHub release. Configuration is in `.releaserc.json`.

Commit messages decide the version, using [Conventional Commits](https://www.conventionalcommits.org/):

| Commit                                                           | Release              |
| ---------------------------------------------------------------- | -------------------- |
| `fix: keep ids unique across variants`                           | patch, 0.1.0 → 0.1.1 |
| `feat: add a wave animation`                                     | minor, 0.1.0 → 0.2.0 |
| `feat!: …` or a `BREAKING CHANGE:` footer                        | major, 0.1.0 → 1.0.0 |
| `docs:`, `chore:`, `test:`, `refactor:`, `ci:` and anything else | no release           |

Anything that changes the drawings for an existing name changes the output (see Stability in the core README), so it needs a `feat:` at least, and a breaking change once the packages reach 1.0.

npm authenticates with [trusted publishing](https://docs.npmjs.com/trusted-publishers), so there is no npm token. Each package on npmjs.com has a trusted publisher for the `markwylde/chara` repository and the `release.yml` workflow, and packages get provenance automatically.

## Licence

MIT
