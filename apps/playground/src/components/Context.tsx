import type { AvatarState, ThemeId } from '@markwylde/chara';
import { Avatar } from '@markwylde/chara-react';
import { BOT_NAMES } from '../names';
import { LIMITS, type Settings } from '../settings';
import { effectiveOptions } from '../snippet';
import { Segmented, Slider, Switch } from './controls';

interface Status {
  state: AvatarState;
  text: string;
  offline?: boolean;
}

const STATUSES: Status[] = [
  { state: 'working', text: 'Running tests' },
  { state: 'thinking', text: 'Thinking' },
  { state: 'success', text: 'Finished' },
  { state: 'sleeping', text: 'Offline', offline: true },
];
const STATE_TEXT: Record<AvatarState, string> = {
  idle: 'Online',
  thinking: 'Thinking',
  working: 'Working',
  success: 'Finished',
  error: 'Needs attention',
  sleeping: 'Asleep',
};

/** The avatars inside example app chrome: a sidebar, a chat thread and a profile card. */
export function Context(props: {
  settings: Settings;
  label: string;
  set: (patch: Partial<Settings>) => void;
}) {
  const { settings: s, label, set } = props;
  const people = [...BOT_NAMES, label].map((name, i) => {
    const mine = i === BOT_NAMES.length;
    const status: Status =
      s.statuses && !mine
        ? (STATUSES[i] as Status)
        : { state: s.state, text: mine || !s.statuses ? STATE_TEXT[s.state] : '' };
    return { name, key: mine ? 'current-name' : name, mine, status };
  });

  const avatar = (person: (typeof people)[number], size: number, theme: ThemeId = s.theme) => (
    <Avatar
      name={person.mine ? s.name : person.name}
      theme={theme}
      size={size}
      radius={s.radius}
      {...effectiveOptions({
        standalone: s.standalone,
        animate: s.animate,
        state: person.status.state,
        mono: s.mono || (s.statuses && !!person.status.offline),
      })}
    />
  );
  const [claudette, imagine, infrado, , me] = people as [
    (typeof people)[number],
    (typeof people)[number],
    (typeof people)[number],
    (typeof people)[number],
    (typeof people)[number],
  ];
  const thread = [
    {
      who: claudette,
      time: '09:41',
      text: "I've split the release into three steps. Starting on the tests now.",
    },
    { who: me, time: '09:42', text: "Ship it when they're green." },
    { who: infrado, time: '09:44', text: 'Staging deploy finished in 42 seconds.' },
    { who: imagine, time: '09:45', text: '', typing: true },
  ];

  return (
    <section className="context" aria-labelledby="context-heading">
      <div className="section-head">
        <div>
          <h2 id="context-heading">In your app</h2>
          <p>How they hold up inside real interface chrome, at the size you'd actually use.</p>
        </div>
        <div className="toolbar">
          <Slider
            id="icon-size-input"
            label="Icon size"
            value={s.iconSize}
            range={LIMITS.iconSize}
            onChange={(iconSize) => set({ iconSize })}
          />
          <Segmented
            name="tone"
            label="Surface"
            value={s.tone}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
            onChange={(tone) => set({ tone })}
          />
          <Switch id="statuses-input" checked={s.statuses} onChange={(statuses) => set({ statuses })}>
            Mixed statuses
          </Switch>
        </div>
      </div>

      <div className={`mocks ${s.tone}`} style={{ '--icon': `${s.iconSize}px` } as React.CSSProperties}>
        <ul className="mock sidebar" aria-label="Sidebar example">
          <li className="mock-title">Agents</li>
          {people.map((person, i) => (
            <li key={person.key} className={i === 0 ? 'row selected' : 'row'}>
              {avatar(person, s.iconSize)}
              <span className="who">
                <b>{person.name}</b>
                {person.status.text && <small>{person.status.text}</small>}
              </span>
            </li>
          ))}
        </ul>

        <ol className="mock thread" aria-label="Chat example">
          <li className="mock-title"># release-train</li>
          {thread.map((message) => (
            <li key={message.time} className="message">
              {avatar(message.who, s.iconSize)}
              <div>
                <p className="meta">
                  <b>{message.who.name}</b>
                  <time>{message.time}</time>
                </p>
                {message.typing ? (
                  <p className="typing">
                    <span className="visually-hidden">{message.who.name} is typing</span>
                    <i />
                    <i />
                    <i />
                  </p>
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mock profile">
          <div className="portrait">{avatar(me, Math.min(Math.round(s.iconSize * 3.2), 168))}</div>
          <b>{label}</b>
          <span className="handle">@{label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unnamed'}</span>
          <span className="pill" data-state={s.state}>
            {STATE_TEXT[s.state]}
          </span>
          <div className="stack">
            {people.slice(0, 4).map((person) => (
              <span key={person.key}>{avatar(person, Math.max(20, Math.round(s.iconSize * 0.9)))}</span>
            ))}
            <em>+12</em>
          </div>
        </div>
      </div>
    </section>
  );
}
