import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core.ts',
    'themes/mecha': 'src/themes/mecha.ts',
    'themes/critter': 'src/themes/critter.ts',
    'themes/sigil': 'src/themes/sigil.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  splitting: true,
  treeshake: true,
  target: 'es2020',
});
