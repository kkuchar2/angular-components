#!/usr/bin/env node
/**
 * Embeds generic-table-tanstack cell component sources into
 * tanstack-cell-sources.ts for demo code tabs.
 *
 * Concatenates .ts + .html + .scss so demo tabs still show the full component.
 *
 * Usage: node scripts/generate-tanstack-cell-sources.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cellsDir = path.join(root, 'src/app/components/generic-table-tanstack/cells');
const outPath = path.join(
  root,
  'src/app/pages/generic-table-tanstack-demo/tanstack-cell-sources.ts',
);

const files = {
  StatusBadge: 'status-badge-cell.component',
  Person: 'person-cell.component',
  Mailto: 'mailto-cell.component',
  Boolean: 'boolean-cell.component',
  PresencePulse: 'presence-pulse-cell.component',
  ProgressBar: 'progress-bar-cell.component',
  Trend: 'trend-cell.component',
};

function toTemplateLiteral(source) {
  return source
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function readPart(baseName, ext) {
  return fs.readFileSync(path.join(cellsDir, `${baseName}.${ext}`), 'utf8').replace(/\n$/, '');
}

function bundleCell(baseName) {
  const ts = readPart(baseName, 'ts');
  const html = readPart(baseName, 'html');
  const scss = readPart(baseName, 'scss');
  return [
    `// ${baseName}.ts`,
    ts,
    '',
    `// ${baseName}.html`,
    html,
    '',
    `// ${baseName}.scss`,
    scss,
  ].join('\n');
}

const entries = Object.entries(files).map(([key, baseName]) => {
  const source = bundleCell(baseName);
  return `  ${key}: \`\n${toTemplateLiteral(source)}\n\`,`;
});

const contents = `/**
 * Source of shared tanstack table cell components for demo code tabs.
 *
 * Regenerate after editing cells:
 *   node scripts/generate-tanstack-cell-sources.mjs
 */
import type { DemoCodeCellTab } from '../../shared/demo-code-block/demo-code.util';

export const tanstackCellSources = {
${entries.join('\n')}
} as const;

export type TanstackCellSourceKey = keyof typeof tanstackCellSources;

/** Build demo code tabs for the given cell component keys (order preserved). */
export function tanstackCellTabs(
  ...keys: TanstackCellSourceKey[]
): DemoCodeCellTab[] {
  return keys.map((key) => ({
    label: key,
    code: tanstackCellSources[key],
  }));
}
`;

fs.writeFileSync(outPath, contents);
console.log('Wrote', path.relative(root, outPath));
