import { type AvatarState, createAvatar, STATES, type ThemeId } from '@markwylde/chara';
import { Avatar } from '@markwylde/chara-react';
import { useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard';
import { BOT_NAMES, SAMPLE_NAMES } from './names';
import { buildReactSnippet, effectiveOptions } from './snippet';

const THEMES: { id: ThemeId; label: string; blurb: string }[] = [
  {
    id: 'mecha',
    label: 'Mecha',
    blurb: 'Robot faces assembled from antennas, ears, heads, eyes, mouths and small details.',
  },
  {
    id: 'critter',
    label: 'Critter',
    blurb:
      'Soft creatures whose body outline is generated from the name. Standalone, they get feet and arms.',
  },
  {
    id: 'sigil',
    label: 'Sigil',
    blurb:
      "A line walked on a 5×5 grid and mirrored, over a gradient. The closest relative of GitHub's identicons.",
  },
];

type Notice = { kind: 'ok'; message: string } | { kind: 'fallback'; message: string; text: string } | null;

export function App() {
  const [name, setName] = useState('Maple');
  const [size, setSize] = useState(96);
  const [radius, setRadius] = useState(24);
  const [standalone, setStandalone] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [state, setState] = useState<AvatarState>('idle');
  const [mono, setMono] = useState(false);
  const [galleryTheme, setGalleryTheme] = useState<ThemeId>('mecha');
  const [notice, setNotice] = useState<Notice>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (notice?.kind === 'fallback') fallbackRef.current?.select();
    if (notice?.kind !== 'ok') return;
    const timer = setTimeout(() => setNotice(null), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  const label = name.trim() || 'Unnamed';
  // What is actually drawn and copied: animation only ever applies to standalone avatars.
  const look = effectiveOptions({ standalone, animate, state, mono });
  const still = effectiveOptions({ standalone, animate: false, state, mono });

  const copy = async (text: string, what: string) => {
    const result = await copyText(text);
    setNotice(
      result.ok
        ? { kind: 'ok', message: `Copied ${what}` }
        : {
            kind: 'fallback',
            message: `Couldn't copy ${what} automatically. It's selected below, so press Ctrl+C or ⌘C.`,
            text: result.text,
          },
    );
  };

  return (
    <div className="page">
      <header className="masthead">
        <div className="brand">
          <h1>Chara</h1>
          <p>
            Turn any name into a unique SVG avatar. The same name always gives the same avatar, so there's
            nothing to store.
          </p>
          <p className="links">
            <a href="https://github.com/markwylde/chara">GitHub</a>
            <span aria-hidden="true">·</span>
            <code>npm i @markwylde/chara</code>
          </p>
        </div>
        <form className="controls" onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            <span>Name</span>
            <input
              id="name-input"
              type="text"
              value={name}
              maxLength={64}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>
              Size <output>{size}px</output>
            </span>
            <input
              id="size-input"
              type="range"
              min={16}
              max={360}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>
              Radius <output>{radius === 50 ? 'circle' : radius}</output>
            </span>
            <input
              id="radius-input"
              type="range"
              min={0}
              max={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </label>
          <div className="field">
            <span id="variant-label">Variant</span>
            <fieldset className="segmented" aria-labelledby="variant-label">
              {[false, true].map((value) => (
                <label key={String(value)} className={standalone === value ? 'on' : undefined}>
                  <input
                    type="radio"
                    name="variant"
                    checked={standalone === value}
                    onChange={() => setStandalone(value)}
                  />
                  {value ? 'Standalone' : 'Tile'}
                </label>
              ))}
            </fieldset>
          </div>
          <div className="field toggles">
            <label className="check">
              <input
                id="animate-input"
                type="checkbox"
                checked={animate}
                disabled={!standalone}
                onChange={(e) => setAnimate(e.target.checked)}
              />
              Animate
            </label>
            <label className="check">
              <input
                id="mono-input"
                type="checkbox"
                checked={mono}
                onChange={(e) => setMono(e.target.checked)}
              />
              No colour
            </label>
          </div>
          <label className="field">
            <span>State</span>
            <select
              id="state-input"
              value={state}
              disabled={!standalone || !animate}
              onChange={(e) => setState(e.target.value as AvatarState)}
            >
              {STATES.map((value) => (
                <option key={value} value={value}>
                  {value[0]?.toUpperCase()}
                  {value.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </form>
      </header>

      <div className="notice" id="notice" role="status" aria-live="polite">
        {notice && <p className={`notice-message ${notice.kind}`}>{notice.message}</p>}
        {notice?.kind === 'fallback' && (
          <textarea
            id="copy-fallback"
            ref={fallbackRef}
            readOnly
            value={notice.text}
            aria-label="Text to copy"
            rows={4}
          />
        )}
      </div>

      <main className="themes">
        {THEMES.map((theme) => (
          <section
            className="sheet"
            key={theme.id}
            data-theme-id={theme.id}
            aria-labelledby={`h-${theme.id}`}
          >
            <div className="sheet-head">
              <div>
                <h2 id={`h-${theme.id}`}>{theme.label}</h2>
                <p>{theme.blurb}</p>
              </div>
              <div className="actions">
                <button
                  type="button"
                  onClick={() =>
                    copy(createAvatar(name, { theme: theme.id, size, radius, ...look }), `${theme.label} SVG`)
                  }
                >
                  Copy SVG
                </button>
                <button
                  type="button"
                  onClick={() =>
                    copy(
                      buildReactSnippet({ name, theme: theme.id, size, radius, ...look }),
                      `${theme.label} React snippet`,
                    )
                  }
                >
                  Copy React
                </button>
              </div>
            </div>
            <div className="previews">
              <figure className="surface light">
                <Avatar
                  name={name}
                  theme={theme.id}
                  size={size}
                  radius={radius}
                  title={`${label}, ${theme.label}`}
                  {...look}
                />
                <figcaption>{label} on light</figcaption>
              </figure>
              <figure className="surface dark">
                <Avatar name={name} theme={theme.id} size={size} radius={radius} {...look} />
                <figcaption>{label} on dark</figcaption>
              </figure>
              <div className="sidebars">
                {(['dark', 'light'] as const).map((tone) => (
                  <ul className={`sidebar ${tone}`} key={tone} aria-label={`Sidebar preview, ${tone}`}>
                    {[...BOT_NAMES, label].map((bot, i) => (
                      <li
                        key={i === BOT_NAMES.length ? 'current-name' : bot}
                        className={i === 0 ? 'selected' : undefined}
                      >
                        <Avatar
                          name={bot}
                          theme={theme.id}
                          size={20}
                          radius={Math.min(radius, 50) * 0.5 + 4}
                          {...still}
                        />
                        <span>{bot}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>

      <section className="gallery" aria-labelledby="gallery-heading">
        <div className="gallery-head">
          <h2 id="gallery-heading">Twenty more names</h2>
          <fieldset className="segmented">
            <legend className="visually-hidden">Gallery theme</legend>
            {THEMES.map((theme) => (
              <label key={theme.id} className={galleryTheme === theme.id ? 'on' : undefined}>
                <input
                  type="radio"
                  name="gallery-theme"
                  id={`gallery-${theme.id}`}
                  value={theme.id}
                  checked={galleryTheme === theme.id}
                  onChange={() => setGalleryTheme(theme.id)}
                />
                {theme.label}
              </label>
            ))}
          </fieldset>
        </div>
        <ul className="grid" data-gallery-theme={galleryTheme}>
          {SAMPLE_NAMES.map((sample) => (
            <li key={sample}>
              <Avatar name={sample} theme={galleryTheme} radius={radius} {...still} />
              <span>{sample}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="foot">
        <p>
          MIT licensed. Avatars are generated in your browser by <code>@markwylde/chara</code>.
        </p>
      </footer>
    </div>
  );
}
