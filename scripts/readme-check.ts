import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * Extracts every ```ts / ```tsx block from a README, writes each to a scratch
 * directory and type-checks them. Returns the diagnostics as strings.
 */
export function checkReadme(
  readmePath: string,
  scratchDir: string,
  paths: Record<string, string[]>,
): string[] {
  const readme = readFileSync(readmePath, 'utf8');
  const blocks = [...readme.matchAll(/```(tsx?)\n([\s\S]*?)```/g)];
  if (blocks.length === 0) return ['README has no ts/tsx code blocks'];
  rmSync(scratchDir, { recursive: true, force: true });
  mkdirSync(scratchDir, { recursive: true });
  const files = blocks.map((m, i) => {
    const file = join(scratchDir, `example-${i}.${m[1]}`);
    writeFileSync(file, `${m[2]}\nexport {};\n`);
    return file;
  });
  const program = ts.createProgram(files, {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    types: [],
    baseUrl: scratchDir,
    paths,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  rmSync(scratchDir, { recursive: true, force: true });
  return diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}
