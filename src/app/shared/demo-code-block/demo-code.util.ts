/** One usage example with optional HTML / TypeScript panes. */
export interface DemoCodeSnippet {
  html?: string;
  ts?: string;
}

/**
 * Build a copy-ready code string from an indented template literal.
 * Strips a shared leading indent so snippets stay readable in source files
 * without shipping that indent to the preview / clipboard.
 */
export function code(raw: TemplateStringsArray | string, ...values: unknown[]): string {
  const composed =
    typeof raw === 'string'
      ? raw
      : raw.reduce((result, part, index) => result + part + (index < values.length ? String(values[index]) : ''), '');

  const trimmed = composed.replace(/^\r?\n/, '').replace(/\r?\n[ \t]*$/, '');
  const lines = trimmed.split(/\r?\n/);
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => /^[ \t]*/.exec(line)?.[0].length ?? 0);
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;

  return lines.map((line) => line.slice(minIndent)).join('\n').trimEnd() + '\n';
}
