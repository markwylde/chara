// Publishes one workspace to npm, unless that exact version is already there.
// That makes a re-run of a half-finished release safe. semantic-release calls this from the
// Release workflow; run it by hand (after npm login) only for the very first publish.
//   node scripts/publish.mjs @markwylde/chara
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const name = process.argv[2];
const dir = { '@markwylde/chara': 'chara', '@markwylde/chara-react': 'chara-react' }[name];
if (!dir) {
  console.error('Usage: node scripts/publish.mjs @markwylde/chara | @markwylde/chara-react');
  process.exit(1);
}
const root = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(`${root}packages/${dir}/package.json`, 'utf8'));

let published = false;
try {
  const out = execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  published = out.trim() === version;
} catch {
  // A 404 means the package or version does not exist yet.
}
if (published) {
  console.log(`${name}@${version} is already on npm; nothing to do.`);
  process.exit(0);
}

// Pre-releases (0.2.0-beta.1) go to the "next" tag so "latest" stays stable.
const tag = version.includes('-') ? 'next' : 'latest';
const args = ['publish', '-w', name, '--access', 'public', '--tag', tag];
// In GitHub Actions npm authenticates with trusted publishing (OIDC) and adds provenance itself.
if (process.argv.includes('--dry-run')) args.push('--dry-run');
execFileSync('npm', args, { cwd: root, stdio: 'inherit' });
