import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkReadme } from '../../../scripts/readme-check.js';

const pkg = fileURLToPath(new URL('../', import.meta.url));

describe('README', () => {
  it('code samples type-check', () => {
    const errors = checkReadme(`${pkg}README.md`, `${pkg}.readme-check`, {
      '@markwylde/chara': [`${pkg}src/index.ts`],
      '@markwylde/chara/core': [`${pkg}src/core.ts`],
      '@markwylde/chara/themes/*': [`${pkg}src/themes/*.ts`],
    });
    expect(errors).toEqual([]);
  });
});
