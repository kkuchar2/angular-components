#!/usr/bin/env node
/**
 * Embeds generic-table-tanstack cell component sources into
 * tanstack-cell-sources.ts for demo code tabs.
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
  StatusBadge: 'status-badge-cell.component.ts',
  Person: 'person-cell.component.ts',
  Mailto: 'mailto-cell.component.ts',
  Boolean: 'boolean-cell.component.ts',
  PresencePulse: 'presence-pulse-cell.component.ts',
  ProgressBar: 'progress-bar-cell.component.ts',
  Trend: 'trend-cell.component.ts',
};

function toTemplateLiteral(source) {
  return source
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

const entries = Object.entries(files).map(([key, file]) => {
  const source = fs.readFileSync(path.join(cellsDir, file), 'utf8').replace(/\n$/, '');
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
