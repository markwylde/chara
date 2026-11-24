import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const pkg = (path: string) => fileURLToPath(new URL(`../../packages/${path}`, import.meta.url));

export default defineConfig({
  base: '/chara/',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@markwylde\/chara\/core$/, replacement: pkg('chara/src/core.ts') },
      { find: /^@markwylde\/chara\/themes\/(.*)$/, replacement: pkg('chara/src/themes/$1.ts') },
      { find: /^@markwylde\/chara$/, replacement: pkg('chara/src/index.ts') },
      { find: /^@markwylde\/chara-react$/, replacement: pkg('chara-react/src/index.ts') },
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        golden: fileURLToPath(new URL('golden.html', import.meta.url)),
        lab: fileURLToPath(new URL('lab.html', import.meta.url)),
      },
    },
  },
  preview: { port: 4173, strictPort: true },
  test: { include: ['test/**/*.test.ts'] },
});
