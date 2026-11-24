import { animationScope } from './animation.js';
import { el, num, type SvgNode } from './svg.js';

/** Removes the animation hooks (`class`, `display`) from nodes, for the tile variant. */
export function untagged(nodes: SvgNode[]): SvgNode[] {
  return nodes.map((node) => {
    const { class: _class, display: _display, ...attrs } = node.attrs;
    return {
      tag: node.tag,
      attrs,
      children: node.children.map((child) => (typeof child === 'string' ? child : untagged([child])[0]!)),
    };
  });
}

/** A group with an animation class. */
export function part(cls: string, ...children: (SvgNode | SvgNode[])[]): SvgNode {
  return el('g', { class: cls }, ...children);
}

/** Three floating Zs, hidden unless the avatar is animated and sleeping. */
export function zzz(x: number, y: number, color: string): SvgNode {
  const z = (dx: number, dy: number, scale: number, i: number) =>
    el(
      'g',
      { transform: `translate(${num(x + dx)} ${num(y + dy)}) scale(${scale})` },
      el('path', {
        class: `chara-z chara-z${i}`,
        d: 'M0 0H5L0 6H5',
        fill: 'none',
        stroke: color,
        'stroke-width': 1.9,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );
  return el(
    'g',
    { class: 'chara-zzz', display: 'none' },
    z(0, 0, 0.8, 1),
    z(5, -7, 1.05, 2),
    z(11, -16, 1.35, 3),
  );
}

/** Selector and keyframe-name helpers that keep a theme's CSS inside its own scope. */
export function scope(themeId: string) {
  const root = animationScope(themeId);
  return {
    /** Any animated avatar of this theme. */
    any: root,
    /** An animated avatar of this theme in one state. */
    in: (state: string) => `.chara-${themeId}[data-state=${state}]`,
    /** A keyframes name owned by this theme. */
    k: (name: string) => `chara-${themeId}-${name}`,
  };
}

export const ERROR_RED = '#ff5247';
export const ERROR_GREY = '#8c8c8c';

/**
 * Rules and keyframes that put a pulsing glow around the body in the error
 * state, on top of the shake: red, or grey for a mono avatar.
 */
export function errorGlowCss(themeId: string): string {
  const s = scope(themeId);
  const frames = (name: string, c: string) =>
    `@keyframes ${s.k(name)}{0%,100%{filter:drop-shadow(0 0 1.5px ${c}) drop-shadow(0 0 4px ${c})}50%{filter:drop-shadow(0 0 3px ${c}) drop-shadow(0 0 8px ${c})}}`;
  const rule = (extra: string, name: string) =>
    `${s.in('error')}${extra} .chara-body{animation:${s.k('shake')} 1.9s ease-in-out infinite,${s.k(name)} 1.3s ease-in-out infinite}`;
  return (
    rule('', 'alarm') +
    rule('[data-mono]', 'alarm-mono') +
    frames('alarm', ERROR_RED) +
    frames('alarm-mono', ERROR_GREY)
  );
}

/**
 * Animation shared by characters with a face (eyes, lights, mouth, arms,
 * shadow, Zs). `idle` holds the theme's own idle rules and `states` its
 * state rules; they are placed so that state rules win over idle ones.
 */
export function faceCss(themeId: string, idle: string, states: string, frames: string): string {
  const s = scope(themeId);
  const { any, k } = s;
  return (
    `${any} :is(.chara-body,.chara-top,.chara-eyes,.chara-look,.chara-mouth,.chara-arm,.chara-shadow,.chara-glow,.chara-z){transform-box:fill-box;transform-origin:center}` +
    `${any} .chara-top{transform-origin:50% 100%}` +
    `${any} .chara-arm-l{transform-origin:85% 15%}` +
    `${any} .chara-arm-r{transform-origin:15% 15%}` +
    `${any} .chara-eyes{animation:${k('blink')} 4.6s infinite}` +
    `${any} .chara-glow{animation:${k('glow')} 2.6s ease-in-out infinite}` +
    idle +
    `${s.in('thinking')} .chara-look{animation:${k('look')} 3.4s ease-in-out infinite}` +
    `${s.in('thinking')} .chara-glow{animation:${k('glow')} .9s ease-in-out infinite}` +
    `${s.in('working')} .chara-mouth{animation:${k('talk')} .32s ease-in-out infinite alternate}` +
    `${s.in('working')} .chara-glow{animation:${k('glow')} .45s steps(2) infinite}` +
    `${s.in('working')} .chara-arm-l,${s.in('success')} .chara-arm-l{animation:${k('wave-l')} .28s ease-in-out infinite alternate}` +
    `${s.in('working')} .chara-arm-r,${s.in('success')} .chara-arm-r{animation:${k('wave-r')} .28s ease-in-out infinite alternate}` +
    `${s.in('success')} .chara-body{animation:${k('hop')} 1.7s cubic-bezier(.3,.6,.4,1) infinite}` +
    `${s.in('success')} .chara-shadow{animation:${k('hop-shadow')} 1.7s ease-in-out infinite}` +
    `${s.in('success')} .chara-glow{animation:${k('glow')} .5s ease-in-out infinite}` +
    `${s.in('error')} .chara-eyes{animation:none}` +
    `${s.in('error')} .chara-glow{fill:${ERROR_RED};animation:${k('glow')} .5s steps(2) infinite}` +
    `${s.in('error')}[data-mono] .chara-glow{fill:${ERROR_GREY}}` +
    `${s.in('sleeping')} .chara-zzz{display:block}` +
    `${s.in('sleeping')} .chara-z{opacity:0;animation:${k('zzz')} 3.3s ease-out infinite}` +
    `${s.in('sleeping')} .chara-z2{--chara-d:.5s}` +
    `${s.in('sleeping')} .chara-z3{--chara-d:1s}` +
    `${s.in('sleeping')} .chara-eyes{animation:none;transform:scaleY(.1)}` +
    `${s.in('sleeping')} .chara-glow{animation:${k('glow')} 5s ease-in-out infinite;fill-opacity:.35}` +
    states +
    errorGlowCss(themeId) +
    `@keyframes ${k('blink')}{0%,93%,100%{transform:scaleY(1)}96.5%{transform:scaleY(.08)}}` +
    `@keyframes ${k('glow')}{0%,100%{opacity:1}50%{opacity:.45}}` +
    `@keyframes ${k('look')}{0%,8%{transform:translate(0,0)}18%,42%{transform:translate(-2.4px,-1.6px)}56%,84%{transform:translate(2.4px,-1.6px)}96%,100%{transform:translate(0,0)}}` +
    `@keyframes ${k('talk')}{from{transform:scaleY(.45)}to{transform:scaleY(1.25)}}` +
    `@keyframes ${k('wave-l')}{from{transform:rotate(8deg)}to{transform:rotate(58deg)}}` +
    `@keyframes ${k('wave-r')}{from{transform:rotate(-8deg)}to{transform:rotate(-58deg)}}` +
    `@keyframes ${k('hop')}{0%,62%,100%{transform:translateY(0) scale(1)}8%{transform:scale(1.06,.9)}24%{transform:translateY(-9px) scale(.96,1.05)}38%{transform:scale(1.05,.93)}48%{transform:translateY(-4px)}56%{transform:scale(1.02,.97)}}` +
    `@keyframes ${k('hop-shadow')}{0%,62%,100%{transform:scaleX(1)}24%{transform:scaleX(.6)}38%{transform:scaleX(1)}48%{transform:scaleX(.8)}}` +
    `@keyframes ${k('shake')}{0%,30%,100%{transform:translateX(0) rotate(0)}5%{transform:translateX(-2.2px) rotate(-2deg)}10%{transform:translateX(2.2px) rotate(2deg)}15%{transform:translateX(-1.8px) rotate(-1.5deg)}20%{transform:translateX(1.4px) rotate(1deg)}25%{transform:translateX(-.8px)}}` +
    `@keyframes ${k('zzz')}{0%{opacity:0;transform:translate(-2px,3px) scale(.6)}25%{opacity:1}70%{opacity:.9}100%{opacity:0;transform:translate(3px,-6px) scale(1.15)}}` +
    `@keyframes ${k('sway')}{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}` +
    frames
  );
}
