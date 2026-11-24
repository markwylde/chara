import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@markwylde\/chara\/core$/,
        replacement: fileURLToPath(new URL('../chara/src/core.ts', import.meta.url)),
      },
      {
        find: /^@markwylde\/chara$/,
        replacement: fileURLToPath(new URL('../chara/src/index.ts', import.meta.url)),
      },
    ],
  },
  test: { include: ['test/**/*.test.{ts,tsx}'], environment: 'jsdom' },
});
