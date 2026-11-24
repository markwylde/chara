#!/usr/bin/env node
// Packs both packages, installs the tarballs into a throwaway consumer project
// and checks them the way a real user would: ESM import, CJS require, subpath
// exports, TypeScript declarations, and that the React build imports React and
// the core package instead of bundling them.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const check = (ok, message) => {
  if (!ok) throw new Error(`Packed-consumer check failed: ${message}`);
  console.log(`  ✓ ${message}`);
};

const work = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), 'chara-packed-'));
try {
  console.log('Building and packing…');
  run('npm', ['run', 'build', '-w', '@markwylde/chara', '-w', '@markwylde/chara-react'], root);
  const core = run('npm', ['pack', '--pack-destination', work, '-w', '@markwylde/chara', '--silent'], root)
    .trim()
    .split('\n')
    .pop();
  const react = run(
    'npm',
    ['pack', '--pack-destination', work, '-w', '@markwylde/chara-react', '--silent'],
    root,
  )
    .trim()
    .split('\n')
    .pop();

  const app = join(work, 'app');
  run('mkdir', ['-p', app]);
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, type: 'module' }),
  );
  console.log('Installing tarballs into a fresh project…');
  run(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      join(work, core),
      join(work, react),
      'react@19',
      'react-dom@19',
      '@types/react@19',
      'typescript@5.9',
    ],
    app,
  );

  writeFileSync(
    join(app, 'esm.mjs'),
    `import { createAvatar } from '@markwylde/chara';
import { createAvatar as coreCreate } from '@markwylde/chara/core';
import { sigil } from '@markwylde/chara/themes/sigil';
import { Avatar } from '@markwylde/chara-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const a = createAvatar('Claudette', { theme: 'sigil' });
const b = coreCreate('Claudette', { theme: sigil });
if (a !== b || !a.startsWith('<svg')) throw new Error('ESM output mismatch');
const html = renderToStaticMarkup(createElement(Avatar, { name: 'Claudette', theme: 'sigil' }));
if (!html.startsWith('<svg')) throw new Error('React ESM render failed');
console.log('esm ok');
`,
  );
  check(
    run('node', ['esm.mjs'], app).includes('esm ok'),
    'ESM import of root, /core, /themes/sigil and the React package',
  );

  writeFileSync(
    join(app, 'cjs.cjs'),
    `const { createAvatar } = require('@markwylde/chara');
const { mecha } = require('@markwylde/chara/themes/mecha');
const core = require('@markwylde/chara/core');
const { Avatar } = require('@markwylde/chara-react');
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
if (createAvatar('x') !== core.createAvatar('x', { theme: mecha })) throw new Error('CJS output mismatch');
if (!renderToStaticMarkup(createElement(Avatar, { name: 'x' })).startsWith('<svg')) throw new Error('React CJS render failed');
console.log('cjs ok');
`,
  );
  check(
    run('node', ['cjs.cjs'], app).includes('cjs ok'),
    'CJS require of root, /core, /themes/mecha and the React package',
  );

  writeFileSync(
    join(app, 'types.tsx'),
    `import { createAvatar, defineTheme, type AvatarOptions } from '@markwylde/chara';
import { createAvatar as coreCreate } from '@markwylde/chara/core';
import { critter } from '@markwylde/chara/themes/critter';
import { Avatar, useAvatarDataUri } from '@markwylde/chara-react';
const opts: AvatarOptions = { theme: 'critter', size: 32 };
const s: string = createAvatar('a', opts) + coreCreate('a', { theme: critter });
const t = defineTheme({ id: 't', draw: ({ el }) => ({ background: '#000', content: [el('rect')] }) });
export const C = () => <Avatar name="a" theme={t} className="x" />;
export function useX() { return useAvatarDataUri('a', { theme: 'sigil' }) + s; }
// @ts-expect-error unknown theme ids are a type error
createAvatar('a', { theme: 'robot' });
`,
  );
  writeFileSync(
    join(app, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        jsx: 'react-jsx',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        skipLibCheck: false,
        types: [],
      },
      files: ['types.tsx'],
    }),
  );
  run('npx', ['tsc', '-p', 'tsconfig.json'], app);
  check(true, 'TypeScript declarations type-check under NodeNext resolution');

  const reactDist = join(app, 'node_modules/@markwylde/chara-react/dist');
  for (const file of readdirSync(reactDist).filter((f) => /\.(c?js)$/.test(f))) {
    const code = readFileSync(join(reactDist, file), 'utf8');
    check(/from ["']react["']|require\(["']react["']\)/.test(code), `${file} imports react`);
    check(/["']@markwylde\/chara["']/.test(code), `${file} imports @markwylde/chara`);
    check(
      !code.includes('react.production') && !code.includes('__SECRET_INTERNALS') && !code.includes('cyrb128'),
      `${file} bundles no copy of React or the core`,
    );
  }
  const reactPkg = JSON.parse(
    readFileSync(join(app, 'node_modules/@markwylde/chara-react/package.json'), 'utf8'),
  );
  check(reactPkg.peerDependencies?.react === '>=18', 'React is a >=18 peer dependency');
  check(typeof reactPkg.dependencies?.['@markwylde/chara'] === 'string', 'core is a regular dependency');
  console.log('Packed-consumer checks passed.');
} finally {
  rmSync(work, { recursive: true, force: true });
}
