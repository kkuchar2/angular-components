import type { ColumnDef } from './generic-table.types';
import type { GenericTableDateDisplay } from './generic-table-cell.types';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

/** Read `row[key]` as a displayable primitive (or Date). */
export function readCellRawValue<T>(row: T, key: string): unknown {
  if (typeof row !== 'object' || row === null || !(key in row)) {
    return '';
  }

  return (row as Record<string, unknown>)[key];
}

/** Value used for clipboard copy (raw string form, not the pretty display). */
export function resolveCopyValue<T>(column: ColumnDef<T>, row: T): string {
  if (column.cell) {
    return String(column.cell(row));
  }

  const raw = readCellRawValue(row, column.key);

  if (raw == null) {
    return '';
  }

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? '' : raw.toISOString();
  }

  return String(raw);
}

/** Formatted text shown in the cell. */
export function formatColumnCell<T>(column: ColumnDef<T>, row: T): string {
  if (column.cell) {
    return String(column.cell(row));
  }

  const raw = readCellRawValue(row, column.key);

  switch (column.cellType) {
    case 'uuid':
      return formatUuidCell(raw);
    case 'date':
      return formatDateCell(raw, column.dateDisplay ?? 'auto');
    default:
      return formatTextCell(raw);
  }
}

/**
 * Value used for client-side sorting when `sortAccessor` / `cell` are unset.
 * Date columns (and raw `Date` values) sort by timestamp.
 */
export function resolveSortValue<T>(column: ColumnDef<T>, row: T): string | number {
  if (column.sortAccessor) {
    return column.sortAccessor(row);
  }

  if (column.cell) {
    return column.cell(row);
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

export function formatTextCell(raw: unknown): string {
  if (raw == null) {
    return '';
  }

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? '' : raw.toLocaleString();
  }

  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
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

  const mode = resolveDateDisplayMode(raw, parsed, display);

  if (mode === 'date') {
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

  // Date-only: parse as local calendar date to avoid UTC day-shift.
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
