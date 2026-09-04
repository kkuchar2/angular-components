import type { ColumnDef } from './generic-table.types';
import type { GenericTableDateDisplay } from './generic-table-cell.types';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

export function readCellRawValue<T>(row: T, key: string): unknown {
  if (typeof row !== 'object' || row === null || !(key in row)) {
    return '';
  }

  return (row as Record<string, unknown>)[key];
}

export function resolveCellRawValue<T>(column: ColumnDef<T>, row: T): unknown {
  if (column.cell) {
    return column.cell(row);
  }

  return readCellRawValue(row, column.key);
}

export function resolveCopyValue<T>(column: ColumnDef<T>, row: T): string {
  const raw = resolveCellRawValue(column, row);

  if (raw == null) {
    return '';
  }

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? '' : raw.toISOString();
  }

  return String(raw);
}

export function formatColumnCell<T>(column: ColumnDef<T>, row: T): string {
  const raw = resolveCellRawValue(column, row);

  switch (column.cellType) {
    case 'uuid':
      return formatUuidCell(raw);
    case 'date':
      return formatDateCell(raw, column.dateDisplay ?? 'auto');
    default:
      return formatTextCell(raw);
  }
}

export function resolveSortValue<T>(column: ColumnDef<T>, row: T): string | number {
  if (column.sortAccessor) {
    return column.sortAccessor(row);
  }

  const raw = readCellRawValue(row, column.key);

  if (column.cellType === 'date' || raw instanceof Date) {
    const parsed = parseCellDate(raw);
    return parsed ? parsed.getTime() : '';
  }

  if (typeof raw === 'string' || typeof raw === 'number') {
    return raw;
  }

  if (typeof raw === 'boolean') {
    return raw ? 1 : 0;
  }

  return '';
}

export function resolveFilterText<T>(column: ColumnDef<T>, row: T): string {
  const formatted = formatColumnCell(column, row);
  const raw = resolveCellRawValue(column, row);
  let rawText = '';

  if (raw == null) {
    rawText = '';
  } else if (raw instanceof Date) {
    rawText = Number.isNaN(raw.getTime()) ? '' : raw.toISOString();
  } else {
    rawText = String(raw);
  }

  if (!rawText || rawText === formatted) {
    return formatted;
  }

  return `${formatted} ${rawText}`;
}

export function columnMatchesFilter<T>(column: ColumnDef<T>, row: T, needle: string): boolean {
  if (!needle) {
    return true;
  }

  return resolveFilterText(column, row).toLocaleLowerCase().includes(needle);
}

export function resolveToggleValue<T>(column: ColumnDef<T>, row: T): string {
  return formatColumnCell(column, row).trim();
}

export function formatTextCell(raw: unknown): string {
  if (raw == null) {
    return '';
  }

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? '' : raw.toLocaleString();
  }

  return String(raw);
}

export function formatUuidCell(raw: unknown): string {
  return formatTextCell(raw).trim();
}

export function formatDateCell(
  raw: unknown,
  display: GenericTableDateDisplay = 'auto',
): string {
  const parsed = parseCellDate(raw);

  if (!parsed) {
    return formatTextCell(raw);
  }

  if (resolveDateDisplayMode(raw, parsed, display) === 'date') {
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function parseCellDate(raw: unknown): Date | null {
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }

  if (typeof raw !== 'string' && typeof raw !== 'number') {
    return null;
  }

  const text = String(raw).trim();

  if (!text) {
    return null;
  }

  if (DATE_ONLY_RE.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    const local = new Date(year, month - 1, day);

    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveDateDisplayMode(
  raw: unknown,
  parsed: Date,
  display: GenericTableDateDisplay,
): 'date' | 'datetime' {
  if (display === 'date' || display === 'datetime') {
    return display;
  }

  if (typeof raw === 'string') {
    const text = raw.trim();

    if (DATE_ONLY_RE.test(text)) {
      return 'date';
    }

    if (ISO_DATE_TIME_RE.test(text)) {
      return 'datetime';
    }
  }

  if (
    parsed.getHours() === 0 &&
    parsed.getMinutes() === 0 &&
    parsed.getSeconds() === 0 &&
    parsed.getMilliseconds() === 0
  ) {
    return 'date';
  }

  return 'datetime';
}
