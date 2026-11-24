import { type AvatarState, createAvatar, createAvatarDataUri, STATES, type ThemeId } from '@markwylde/chara';
import { Avatar } from '@markwylde/chara-react';
import { useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard';
import { Context } from './components/Context';
import { Group, Segmented, Slider, Switch } from './components/controls';
import { Gallery } from './components/Gallery';
import { BOT_NAMES, GALLERY_NAMES } from './names';
import {
  type Backdrop,
  DEFAULTS,
  fromQuery,
  isValidIdPrefix,
  LIMITS,
  type Settings,
  toQuery,
} from './settings';
import { buildJsSnippet, buildReactSnippet, byteSize, effectiveOptions, extraOptions } from './snippet';

const THEMES: { id: ThemeId; label: string; blurb: string }[] = [
  { id: 'mecha', label: 'Mecha', blurb: 'Robot faces built from antennas, ears, heads, eyes and mouths.' },
  { id: 'critter', label: 'Critter', blurb: 'Soft creatures whose outline is generated from the name.' },
  { id: 'sigil', label: 'Sigil', blurb: 'A line walked on a 5×5 grid and mirrored, like an identicon.' },
];
const BACKDROP_OPTIONS: { value: Backdrop; label: string }[] = [
  { value: 'split', label: 'Both' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'clear', label: 'Clear' },
  { value: 'custom', label: 'Custom' },
];
const OUTPUTS = [
  { value: 'react', label: 'React', what: 'React snippet' },
  { value: 'js', label: 'JavaScript', what: 'JavaScript snippet' },
  { value: 'svg', label: 'SVG', what: 'SVG' },
  { value: 'uri', label: 'Data URI', what: 'data URI' },
] as const;
type Output = (typeof OUTPUTS)[number]['value'];
const APPEARANCES = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;
type Appearance = (typeof APPEARANCES)[number]['value'];
const capital = (text: string) => `${text[0]?.toUpperCase() ?? ''}${text.slice(1)}`;

type Notice = { kind: 'ok'; message: string } | { kind: 'fallback'; message: string; text: string } | null;

function readAppearance(): Appearance {
  try {
    const saved = localStorage.getItem('chara-appearance');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function App() {
  const [s, setSettings] = useState<Settings>(() => fromQuery(window.location.search));
  const [output, setOutput] = useState<Output>('react');
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  const [notice, setNotice] = useState<Notice>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const studioRef = useRef<HTMLElement>(null);
  const set = (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch }));

  // Keep the address bar in step, so any configuration can be shared as a link.
  useEffect(() => {
    const query = toQuery(s);
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [s]);

  useEffect(() => {
    const root = document.documentElement;
    if (appearance === 'system') delete root.dataset.theme;
    else root.dataset.theme = appearance;
    try {
      localStorage.setItem('chara-appearance', appearance);
    } catch {
      // Private windows may refuse storage; the choice then lasts for this visit only.
    }
  }, [appearance]);

  useEffect(() => {
    if (notice?.kind === 'fallback') fallbackRef.current?.select();
    if (notice?.kind !== 'ok') return;
    // Only clear the message this timer belongs to: a newer one may already have replaced it.
    const timer = setTimeout(() => setNotice((current) => (current === notice ? null : current)), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  const animating = s.standalone && s.animate;
  useEffect(() => {
    if (!animating || !s.cycle) return;
    const timer = setInterval(
      () =>
        setSettings((current) => ({
          ...current,
          state: STATES[(STATES.indexOf(current.state) + 1) % STATES.length] as AvatarState,
        })),
      2600,
    );
    return () => clearInterval(timer);
  }, [animating, s.cycle]);

  const label = s.name.trim() || 'Unnamed';
  const themeLabel = capital(s.theme);
  const prefixOk = isValidIdPrefix(s.idPrefix);
  // What is actually drawn and copied: animation only ever applies to standalone avatars.
  const look = effectiveOptions(s);
  const extra = extraOptions({ ...s, idPrefix: prefixOk ? s.idPrefix : '' });
  const options = { theme: s.theme, size: s.size, radius: s.radius, ...look, ...extra };

  const svg = createAvatar(s.name, options);
  const svgSize = byteSize(svg);
  const snippet = { name: s.name, ...options };
  const code =
    output === 'react'
      ? buildReactSnippet(snippet)
      : output === 'js'
        ? buildJsSnippet(snippet)
        : output === 'svg'
          ? svg
          : createAvatarDataUri(s.name, options);

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
  const download = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'avatar'}-${s.theme}.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const random = () => {
    const pool = [...BOT_NAMES, ...GALLERY_NAMES].filter((candidate) => candidate !== s.name);
    set({ name: pool[Math.floor(Math.random() * pool.length)] as string });
  };
  const pickState = (state: AvatarState) => set({ state, standalone: true, animate: true, cycle: false });
  const pickName = (name: string) => {
    set({ name });
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const panes: ('light' | 'dark' | 'clear' | 'custom')[] =
    s.backdrop === 'split' ? ['light', 'dark'] : [s.backdrop];
  const what = OUTPUTS.find((item) => item.value === output)?.what ?? '';

  return (
    <div className="page">
      <header className="topbar">
        <a className="wordmark" href="./" aria-label="Chara home">
          <Avatar name={s.name} theme={s.theme} size={30} radius={30} mono={s.mono} />
          <span>Chara</span>
        </a>
        <nav aria-label="Project links">
          <code className="install">npm i @markwylde/chara</code>
          <a href="https://github.com/markwylde/chara">GitHub</a>
        </nav>
        <Segmented
          name="appearance"
          label="Page appearance"
          showLabel={false}
          value={appearance}
          options={APPEARANCES}
          onChange={setAppearance}
        />
      </header>

      <div className="intro">
        <h1>Chara</h1>
        <p>
          Turn any name into a character. The same name always draws the same one, so there is nothing to
          store. Change anything below; the code underneath keeps up.
        </p>
      </div>

      <main className="studio" ref={studioRef} aria-label="Avatar studio">
        <div className="stage-column">
          <fieldset className="theme-tabs">
            <legend className="visually-hidden">Theme</legend>
            {THEMES.map((theme) => (
              <label
                key={theme.id}
                className={s.theme === theme.id ? 'on' : undefined}
                data-theme-id={theme.id}
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme.id}
                  checked={s.theme === theme.id}
                  onChange={() => set({ theme: theme.id })}
                />
                <Avatar
                  name={s.name}
                  theme={theme.id}
                  size={44}
                  radius={s.radius}
                  normalize={s.normalize}
                  {...effectiveOptions({ ...s, animate: false })}
                />
                <span>
                  <b>{theme.label}</b>
                  <small>{theme.blurb}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="stage" data-backdrop={s.backdrop}>
            {panes.map((pane, i) => (
              <figure
                key={pane}
                className={`pane ${pane}`}
                style={pane === 'custom' ? { background: s.backdropColor } : undefined}
              >
                <Avatar name={s.name} {...options} title={i === 0 ? (extra.title ?? '') : ''} />
                <figcaption>
                  {pane === 'clear'
                    ? 'transparent'
                    : pane === 'custom'
                      ? s.backdropColor
                      : `${label} on ${pane}`}
                </figcaption>
              </figure>
            ))}
            <p className="stage-meta">
              {themeLabel} · {s.standalone ? 'standalone' : 'tile'} · {s.size}px · {svgSize}
            </p>
          </div>

          <fieldset className="states">
            <legend className="label">
              State
              <small>{animating ? 'Each is one attribute on the same SVG' : 'Pick one to animate'}</small>
            </legend>
            <div className="state-row">
              {STATES.map((state) => (
                <label key={state} className={animating && s.state === state ? 'on' : undefined}>
                  <input
                    type="radio"
                    name="state"
                    value={state}
                    checked={animating && s.state === state}
                    onChange={() => pickState(state)}
                  />
                  <Avatar
                    name={s.name}
                    theme={s.theme}
                    size={52}
                    variant="standalone"
                    animated
                    state={state}
                    mono={s.mono}
                    normalize={s.normalize}
                  />
                  <span>{capital(state)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <section className="output" aria-labelledby="output-heading">
            <div className="output-head">
              <h2 id="output-heading" className="visually-hidden">
                Code
              </h2>
              <Segmented
                name="output"
                label="Output format"
                showLabel={false}
                value={output}
                options={OUTPUTS}
                onChange={setOutput}
              />
              <div className="actions">
                <button type="button" className="ghost" onClick={download}>
                  Download SVG
                </button>
                <button
                  type="button"
                  className="primary"
                  id="copy-output"
                  onClick={() => copy(code, `${themeLabel} ${what}`)}
                >
                  Copy {OUTPUTS.find((item) => item.value === output)?.label}
                </button>
              </div>
            </div>
            <pre id="output-code" data-output={output}>
              <code>{code}</code>
            </pre>
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
          </section>
        </div>

        <form className="panel" onSubmit={(e) => e.preventDefault()} aria-label="Options">
          <Group title="Name">
            <div className="name-row">
              <input
                id="name-input"
                type="text"
                value={s.name}
                maxLength={64}
                autoComplete="off"
                spellCheck={false}
                aria-label="Name"
                onChange={(e) => set({ name: e.target.value })}
              />
              <button type="button" id="random-name" onClick={random}>
                Random
              </button>
            </div>
            <div className="chips">
              {BOT_NAMES.map((bot) => (
                <button
                  key={bot}
                  type="button"
                  className={s.name === bot ? 'on' : undefined}
                  onClick={() => set({ name: bot })}
                >
                  {bot}
                </button>
              ))}
            </div>
          </Group>

          <Group title="Shape">
            <Segmented
              name="variant"
              label="Variant"
              value={s.standalone ? 'standalone' : 'tile'}
              options={[
                { value: 'tile', label: 'Tile' },
                { value: 'standalone', label: 'Standalone' },
              ]}
              onChange={(variant) => set({ standalone: variant === 'standalone' })}
            />
            <Slider
              id="size-input"
              label="Size"
              value={s.size}
              range={LIMITS.size}
              onChange={(size) => set({ size })}
              presets={[20, 32, 64, 128, 256].map((value) => ({ value, label: String(value) }))}
            />
            <Slider
              id="radius-input"
              label="Corner radius"
              value={s.radius}
              range={LIMITS.radius}
              display={s.radius === 50 ? 'circle' : String(s.radius)}
              disabled={s.standalone}
              hint="tiles only"
              onChange={(radius) => set({ radius })}
              presets={[
                { value: 0, label: 'Square' },
                { value: 24, label: 'Rounded' },
                { value: 50, label: 'Circle' },
              ]}
            />
          </Group>

          <Group title="Motion and colour">
            <Switch
              id="animate-input"
              checked={animating}
              disabled={!s.standalone}
              hint={s.standalone ? undefined : 'Standalone only'}
              onChange={(animate) => set({ animate })}
            >
              Animate
            </Switch>
            <Switch
              id="cycle-input"
              checked={animating && s.cycle}
              disabled={!animating}
              onChange={(cycle) => set({ cycle })}
            >
              Cycle through states
            </Switch>
            <Switch id="mono-input" checked={s.mono} onChange={(mono) => set({ mono })}>
              No colour
            </Switch>
          </Group>

          <Group title="Backdrop">
            <Segmented
              name="backdrop"
              label="Backdrop"
              showLabel={false}
              wrap
              value={s.backdrop}
              options={BACKDROP_OPTIONS}
              onChange={(backdrop) => set({ backdrop })}
            />
            <label className="color">
              <input
                id="backdrop-color"
                type="color"
                value={s.backdropColor}
                onChange={(e) => set({ backdropColor: e.target.value, backdrop: 'custom' })}
              />
              <span>Custom colour</span>
              <code>{s.backdropColor}</code>
            </label>
          </Group>

          <details className="group advanced">
            <summary>Advanced</summary>
            <label className="text-field">
              <span className="label">Accessible title</span>
              <input
                id="title-input"
                type="text"
                value={s.title}
                maxLength={80}
                placeholder="None (decorative)"
                onChange={(e) => set({ title: e.target.value })}
              />
              <small>
                With a title the SVG is announced as an image. Without one it is hidden from screen readers.
              </small>
            </label>
            <label className="text-field">
              <span className="label">ID prefix</span>
              <input
                id="prefix-input"
                type="text"
                value={s.idPrefix}
                maxLength={32}
                placeholder="None"
                spellCheck={false}
                aria-invalid={!prefixOk}
                onChange={(e) => set({ idPrefix: e.target.value })}
              />
              <small className={prefixOk ? undefined : 'bad'}>
                {prefixOk
                  ? 'Added to every id inside the SVG.'
                  : 'Start with a letter or underscore, then letters, digits, - or _. Ignored until fixed.'}
              </small>
            </label>
            <Switch
              id="normalize-input"
              checked={s.normalize}
              hint='"Maple" and " maple " match'
              onChange={(normalize) => set({ normalize })}
            >
              Ignore case and spacing
            </Switch>
          </details>

          <div className="panel-foot">
            <button
              type="button"
              id="copy-link"
              onClick={() => copy(window.location.href, 'link to this setup')}
            >
              Copy link
            </button>
            <button type="button" id="reset" className="ghost" onClick={() => setSettings(DEFAULTS)}>
              Reset
            </button>
          </div>
        </form>
      </main>

      <Context settings={s} label={label} set={set} />
      <Gallery settings={s} look={look} set={set} onPick={pickName} />

      <footer className="foot">
        <p>
          MIT licensed. Avatars are generated in your browser by <code>@markwylde/chara</code>.
        </p>
      </footer>
    </div>
  );
}
