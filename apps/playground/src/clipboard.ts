export type CopyResult = { ok: true } | { ok: false; text: string };

/** Copies text to the clipboard. Resolves with the text when the browser refuses, so the page can offer it to copy by hand. */
export async function copyText(text: string): Promise<CopyResult> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch {
    return { ok: false, text };
  }
}
