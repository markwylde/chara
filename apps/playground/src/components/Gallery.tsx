import { Avatar } from '@markwylde/chara-react';
import { GALLERY_NAMES } from '../names';
import { GALLERY_COUNTS, LIMITS, type Settings } from '../settings';
import type { LookOptions } from '../snippet';
import { Segmented, Slider } from './controls';

/** A wall of other names in the current theme and look. Picking one loads it into the studio. */
export function Gallery(props: {
  settings: Settings;
  look: LookOptions;
  set: (patch: Partial<Settings>) => void;
  onPick: (name: string) => void;
}) {
  const { settings: s, look, set, onPick } = props;
  return (
    <section className="gallery" aria-labelledby="gallery-heading">
      <div className="section-head">
        <div>
          <h2 id="gallery-heading">Every name is somebody</h2>
          <p>Same theme, same settings, different names. Pick one to load it into the studio.</p>
        </div>
        <div className="toolbar">
          <Slider
            id="gallery-size-input"
            label="Size"
            value={s.gallerySize}
            range={LIMITS.gallerySize}
            onChange={(gallerySize) => set({ gallerySize })}
          />
          <Segmented
            name="gallery-count"
            label="Names"
            value={s.galleryCount}
            options={GALLERY_COUNTS.map((value) => ({ value, label: String(value) }))}
            onChange={(galleryCount) => set({ galleryCount })}
          />
        </div>
      </div>
      <ul
        className="grid"
        data-gallery-theme={s.theme}
        style={{ '--cell': `${s.gallerySize}px` } as React.CSSProperties}
      >
        {GALLERY_NAMES.slice(0, s.galleryCount).map((sample) => (
          <li key={sample}>
            <button type="button" onClick={() => onPick(sample)} aria-label={`Use ${sample}`}>
              <Avatar name={sample} theme={s.theme} size={s.gallerySize} radius={s.radius} {...look} />
              <span>{sample}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
