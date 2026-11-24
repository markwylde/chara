import type { ThemeId } from '@markwylde/chara';

export interface SnippetOptions {
  name: string;
  theme: ThemeId;
  size: number;
  radius: number;
}

/** A JSX snippet for the React package. The name goes in a JS string, so quotes, braces and newlines stay safe. */
export function buildReactSnippet({ name, theme, size, radius }: SnippetOptions): string {
  return [
    "import { Avatar } from '@markwylde/chara-react';",
    '',
    `<Avatar name={${JSON.stringify(name)}} theme="${theme}" size={${size}} radius={${radius}} />`,
  ].join('\n');
}
