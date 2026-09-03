import type { ColumnDef, ColumnToggleConfig, ColumnToggleGroup } from './generic-table.types';
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

/** Resolve the cell value: `cell` accessor when set, otherwise `row[key]`. */
export function resolveCellRawValue<T>(column: ColumnDef<T>, row: T): unknown {
  if (column.cell) {
    return column.cell(row);
  }

  return readCellRawValue(row, column.key);
}

/** Value used for clipboard copy (raw string form, not the pretty display). */
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

/** Formatted text shown in the cell (`cellType` still applies when `cell` is set). */
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

/**
 * Value used for client-side sorting.
 * When `sortAccessor` is unset, uses the raw `row[key]` value (not `cell`).
 * Date columns (and raw `Date` values) sort by timestamp.
 */
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

/**
 * Text used for column filter matching: formatted display plus the raw value
 * so both "Jul 2026" and "2026-07-21" can match a date cell.
 */
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

/** Case-insensitive substring match against {@link resolveFilterText}. */
export function columnMatchesFilter<T>(
  column: ColumnDef<T>,
  row: T,
  query: string,
): boolean {
  const needle = query.trim().toLocaleLowerCase();

  if (!needle) {
    return true;
  }

  return resolveFilterText(column, row).toLocaleLowerCase().includes(needle);
}

/**
 * Display value used for default toggleable filters (formatted cell text).
 * Empty / missing values become `''`.
 */
export function resolveToggleValue<T>(column: ColumnDef<T>, row: T): string {
  return formatColumnCell(column, row).trim();
}

/** One unique value and how many rows carry it. */
export interface GenericTableToggleOption {
  value: string;
  count: number;
}

/** Resolved toggle group bound to its parent column for the filter rail. */
export interface GenericTableToggleFacet<T = unknown> {
  columnKey: string;
  group: ColumnToggleGroup<T>;
  label: string;
  options: GenericTableToggleOption[];
}

export function isColumnToggleConfig<T>(
  value: ColumnDef<T>['toggleable'],
): value is ColumnToggleConfig<T> {
  return typeof value === 'object' && value != null && Array.isArray(value.groups);
}

export function isColumnToggleable<T>(column: ColumnDef<T>): boolean {
  return column.toggleable === true || isColumnToggleConfig(column.toggleable);
}

/** Implicit single-group config when `toggleable: true`. */
export function resolveToggleGroups<T>(column: ColumnDef<T>): ColumnToggleGroup<T>[] {
  if (column.toggleable === true) {
    return [
      {
        id: 'value',
        label: column.header,
        getValues: (row) => resolveToggleValue(column, row),
      },
    ];
  }

  if (isColumnToggleConfig(column.toggleable)) {
    return column.toggleable.groups;
  }

  return [];
}

export function toggleSelectionKey(columnKey: string, groupId: string): string {
  return `${columnKey}::${groupId}`;
}

/** Normalize extractor output to trimmed string values (may include `''`). */
export function normalizeToggleValues(
  raw: string | readonly string[] | null | undefined,
): string[] {
  if (raw == null) {
    return [];
  }

  const list = typeof raw === 'string' ? [raw] : [...raw];
  return list.map((value) => String(value).trim());
}

function sortToggleOptions(options: GenericTableToggleOption[]): GenericTableToggleOption[] {
  return [...options].sort((a, b) => {
    if (a.value === '' && b.value !== '') {
      return 1;
    }

    if (b.value === '' && a.value !== '') {
      return -1;
    }

    return a.value.localeCompare(b.value, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

/** Sorted unique toggle values with counts for a group across `rows`. */
export function collectToggleGroupOptions<T>(
  group: ColumnToggleGroup<T>,
  rows: readonly T[],
): GenericTableToggleOption[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const values = new Set(normalizeToggleValues(group.getValues(row)));

    // Count the row once per distinct extracted value.
    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return sortToggleOptions(
    [...counts.entries()].map(([value, count]) => ({ value, count })),
  );
}

/**
 * @deprecated Prefer {@link collectToggleGroupOptions} with {@link resolveToggleGroups}.
 * Kept for default whole-cell uniqueness.
 */
export function collectUniqueToggleValues<T>(
  column: ColumnDef<T>,
  rows: readonly T[],
): GenericTableToggleOption[] {
  const [group] = resolveToggleGroups(column);
  return group ? collectToggleGroupOptions(group, rows) : [];
}

/**
 * When `selected` is empty, every row matches. Otherwise the row matches if any
 * of its extracted group values is selected.
 */
export function rowMatchesToggleGroup<T>(
  group: ColumnToggleGroup<T>,
  row: T,
  selected: ReadonlySet<string> | undefined,
): boolean {
  if (!selected || selected.size === 0) {
    return true;
  }

  const values = normalizeToggleValues(group.getValues(row));
  return values.some((value) => selected.has(value));
}

/**
 * When `selected` is empty, every row matches. Otherwise the row matches if its
 * toggle value is one of the selected strings.
 */
export function columnMatchesToggleFilter<T>(
  column: ColumnDef<T>,
  row: T,
  selected: ReadonlySet<string> | undefined,
): boolean {
  if (!selected || selected.size === 0) {
    return true;
  }

  return selected.has(resolveToggleValue(column, row));
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
