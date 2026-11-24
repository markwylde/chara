import * as chara from '@markwylde/chara';

declare global {
  interface Window {
    chara: typeof chara;
  }
}

window.chara = chara;
document.body.dataset.ready = 'true';
