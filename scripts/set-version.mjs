// Sets one version on both packages, and the React package's range for the core.
//   node scripts/set-version.mjs 0.2.0          write
//   node scripts/set-version.mjs --check 0.2.0  fail unless everything already says 0.2.0
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const check = args[0] === '--check';
const version = args[check ? 1 : 0];
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  console.error('Usage: node scripts/set-version.mjs [--check] <version>, for example 0.2.0');
  process.exit(1);
}

const file = (name) => fileURLToPath(new URL(`../packages/${name}/package.json`, import.meta.url));
const read = (name) => JSON.parse(readFileSync(file(name), 'utf8'));
const core = read('chara');
const react = read('chara-react');
// While 0.x, a new minor may change the drawings, so the React package stays on the same minor.
const range = `^${version}`;

if (check) {
  const problems = [];
  if (core.version !== version) problems.push(`@markwylde/chara is ${core.version}`);
  if (react.version !== version) problems.push(`@markwylde/chara-react is ${react.version}`);
  if (react.dependencies['@markwylde/chara'] !== range)
    problems.push(`chara-react depends on @markwylde/chara ${react.dependencies['@markwylde/chara']}`);
  if (problems.length) {
    console.error(`Expected ${version} everywhere, but ${problems.join('; ')}.`);
    process.exit(1);
  }
  console.log(`Both packages are at ${version}.`);
} else {
  core.version = version;
  react.version = version;
  react.dependencies['@markwylde/chara'] = range;
  writeFileSync(file('chara'), `${JSON.stringify(core, null, 2)}\n`);
  writeFileSync(file('chara-react'), `${JSON.stringify(react, null, 2)}\n`);
  console.log(`Set both packages to ${version}. Run npm install to update the lockfile.`);
}
