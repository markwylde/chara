import { createAvatar, THEME_IDS } from '@markwylde/chara';
import { GOLDEN_NAMES } from './names';

const out: Record<string, string> = {};
for (const theme of THEME_IDS)
  for (const name of GOLDEN_NAMES) out[`${theme}/${name.toLowerCase()}`] = createAvatar(name, { theme });

const script = document.createElement('script');
script.type = 'application/json';
script.id = 'golden';
script.textContent = JSON.stringify(out);
document.body.appendChild(script);
document.body.dataset.ready = 'true';
