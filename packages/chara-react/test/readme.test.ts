// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkReadme } from '../../../scripts/readme-check.js';

const pkg = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));

describe('README', () => {
  it('code samples type-check', () => {
    const errors = checkReadme(`${pkg}README.md`, `${pkg}.readme-check`, {
      '@markwylde/chara-react': [`${pkg}src/index.ts`],
      '@markwylde/chara': [`${pkg}../chara/src/index.ts`],
      react: [`${root}node_modules/@types/react/index.d.ts`],
      'react/jsx-runtime': [`${root}node_modules/@types/react/jsx-runtime.d.ts`],
    });
    expect(errors).toEqual([]);
  });
});
