#!/usr/bin/env node
// Writes docs/avatars/<theme>-<name>.svg for the root README. Run after `npm run build`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAvatar, THEME_IDS } from '../packages/chara/dist/index.js';

const out = fileURLToPath(new URL('../docs/avatars/', import.meta.url));
mkdirSync(out, { recursive: true });
for (const theme of THEME_IDS) {
  for (const name of ['Claudette', 'Imagine', 'Infrado', 'Personelly', 'Atlas', 'Biscuit']) {
    writeFileSync(
      `${out}${theme}-${name.toLowerCase()}.svg`,
      `${createAvatar(name, { theme, size: 64, title: name })}\n`,
    );
  }
}
console.log(`Wrote avatars to ${out}`);
