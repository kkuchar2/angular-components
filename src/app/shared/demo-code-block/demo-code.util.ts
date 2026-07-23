/** One usage example with optional HTML / TypeScript / Columns / cell panes. */
export interface DemoCodeSnippet {
  html?: string;
  /** Component: data, handlers, table wiring (not column defs). */
  ts?: string;
  /** Column definitions only. */
  columnsTs?: string;
  /** Custom cell components used by this example (one tab each). */
  cells?: DemoCodeCellTab[];
}

/** Extra tab showing a custom cell component's source. */
export interface DemoCodeCellTab {
  /** Tab label, e.g. `StatusBadge`. */
  label: string;
  /** Full TypeScript source for the cell component. */
  code: string;
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
