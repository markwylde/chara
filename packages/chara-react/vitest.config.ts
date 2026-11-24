import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const reactMajor = process.env.CHARA_REACT;
const sandbox = reactMajor
  ? fileURLToPath(new URL(`../../.react-${reactMajor}/node_modules/`, import.meta.url))
  : null;

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
      // With CHARA_REACT=18 (after `node scripts/use-react.mjs 18`), run against that React instead.
      ...(sandbox
        ? [{ find: /^(react|react-dom|@testing-library\/react)(\/.*)?$/, replacement: `${sandbox}$1$2` }]
        : []),
    ],
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    server: { deps: { inline: sandbox ? [/react/, /@testing-library/] : [] } },
  },
});
