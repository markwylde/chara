#!/usr/bin/env node
// Installs a React major into an isolated folder (.react-<major>/) so the React
// package's tests can run against it with CHARA_REACT=<major>, without touching
// the workspace's own React or the lockfile.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const major = process.argv[2];
if (!['18', '19'].includes(major)) {
  console.error('Usage: node scripts/use-react.mjs <18|19>');
  process.exit(1);
}
const dir = fileURLToPath(new URL(`../.react-${major}/`, import.meta.url));
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}package.json`, JSON.stringify({ private: true, name: `react-${major}-sandbox` }));
execFileSync(
  'npm',
  [
    'install',
    '--no-package-lock',
    '--no-audit',
    '--no-fund',
    `react@${major}`,
    `react-dom@${major}`,
    '@testing-library/react@16',
    '@testing-library/dom@10',
  ],
  { cwd: dir, stdio: 'inherit' },
);
console.log(`Installed React ${major} in ${dir}. Run tests with CHARA_REACT=${major}.`);
