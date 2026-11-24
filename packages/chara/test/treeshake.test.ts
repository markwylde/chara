import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('../src/', import.meta.url));

describe('tree-shaking', () => {
  it('a Sigil-only bundle contains no Mecha or Critter code', async () => {
    const result = await build({
      stdin: {
        contents: `
          import { createAvatar } from '@markwylde/chara/core';
          import { sigil } from '@markwylde/chara/themes/sigil';
          console.log(createAvatar('Claudette', { theme: sigil }));
        `,
        resolveDir: src,
        loader: 'ts',
      },
      alias: {
        '@markwylde/chara/core': `${src}core.ts`,
        '@markwylde/chara/themes/sigil': `${src}themes/sigil.ts`,
      },
      bundle: true,
      write: false,
      metafile: true,
      treeShaking: true,
      format: 'esm',
      platform: 'neutral',
    });
    const inputs = Object.keys(result.metafile.inputs);
    expect(inputs.some((p) => p.endsWith('themes/sigil.ts'))).toBe(true);
    expect(inputs.some((p) => /themes\/(mecha|critter)\.ts$/.test(p))).toBe(false);
    const code = result.outputFiles[0]!.text;
    expect(code).not.toContain('M22 56A28 28'); // a Mecha head path
    expect(code).not.toContain('SQRT1_2'); // Critter's direction table
  });
});
