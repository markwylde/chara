import { DOMParser } from '@xmldom/xmldom';

export const GOLDEN_NAMES = [
  'Claudette',
  'Imagine',
  'Infrado',
  'Personelly',
  'Atlas',
  'Biscuit',
  'Cobalt',
  'Dexter',
  'Echo',
  'Fennel',
  'Gizmo',
  'Halcyon',
  'Indigo',
  'Juniper',
  'Kestrel',
  'Lumen',
  'Mango',
  'Nimbus',
  'Otto',
  'Pixel',
  'Quill',
  'Rune',
  'Sable',
  'Tango',
];

/** Parses XML strictly, throwing on any error or fatal error. */
export function parseXml(xml: string) {
  const parser = new DOMParser({
    onError: (level, message) => {
      if (level !== 'warning') throw new Error(`XML ${level}: ${message}`);
    },
  });
  return parser.parseFromString(xml, 'image/svg+xml');
}

/** Replaces every id and url(#id) with its first-seen ordinal so only drawing content is compared. */
export function canonicalize(svg: string): string {
  const seen = new Map<string, string>();
  const token = (id: string) => {
    if (!seen.has(id)) seen.set(id, `id${seen.size}`);
    return seen.get(id)!;
  };
  return svg
    .replace(/id="([^"]+)"/g, (_, id) => `id="${token(id)}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${token(id)})`);
}

/** Deterministic pseudo-random name list. */
export function sampleNames(count: number): string[] {
  const syllables = [
    'ka',
    'lo',
    'mi',
    'zu',
    're',
    'ta',
    'no',
    'vi',
    'sha',
    'qu',
    'or',
    'ex',
    'bel',
    'dan',
    'fi',
    'gr',
  ];
  const out: string[] = [];
  let state = 7;
  for (let i = 0; i < count; i++) {
    let name = '';
    const parts = 2 + (i % 3);
    for (let p = 0; p < parts; p++) {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      name += syllables[state % syllables.length];
    }
    out.push(`${name}${i}`);
  }
  return out;
}
