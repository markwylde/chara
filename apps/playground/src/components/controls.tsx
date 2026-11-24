import type { ReactNode } from 'react';

export function Segmented<T extends string | number>(props: {
  name: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  showLabel?: boolean;
  wrap?: boolean;
}) {
  const { name, label, value, options, onChange, showLabel = true, wrap } = props;
  return (
    <fieldset className={`segmented${wrap ? ' wrap' : ''}`} data-control={name}>
      <legend className={showLabel ? 'label' : 'visually-hidden'}>{label}</legend>
      <div className="segments">
        {options.map((option) => (
          <label key={option.value} className={option.value === value ? 'on' : undefined}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Slider(props: {
  id: string;
  label: string;
  value: number;
  range: readonly [number, number];
  onChange: (value: number) => void;
  display?: string;
  disabled?: boolean;
  hint?: string;
  presets?: readonly { value: number; label: string }[];
}) {
  const { id, label, value, range, onChange, display, disabled, hint, presets } = props;
  return (
    <div className={`slider${disabled ? ' disabled' : ''}`}>
      <label className="label" htmlFor={id}>
        <span>{label}</span>
        <output htmlFor={id}>{disabled && hint ? hint : (display ?? `${value}px`)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={range[0]}
        max={range[1]}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {presets && (
        <div className="presets">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={preset.value === value ? 'on' : undefined}
              disabled={disabled}
              onClick={() => onChange(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Switch(props: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  const { id, checked, onChange, disabled, children, hint } = props;
  return (
    <label className={`switch${disabled ? ' disabled' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="track" aria-hidden="true" />
      <span className="switch-text">
        {children}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

export function Group(props: { title: string; children: ReactNode }) {
  return (
    <section className="group">
      <h3>{props.title}</h3>
      {props.children}
    </section>
  );
}
