import type { Type } from '@angular/core';

import type { GenericTableCellType, GenericTableDateDisplay } from './generic-table-cell.types';

/**
 * Documented NgComponentOutlet inputs for `ColumnDef.cellComponent`.
 *
 * @typeParam T - The row model the table renders.
 */
export interface GenericTableCellComponentInputs<T = unknown> {
  /** Resolved via `cell?.(row) ?? row[key]`. */
  value: unknown;
  /** Full row for the current cell. */
  row: T;
  /** Column definition for the current cell. */
  column: ColumnDef<T>;
}

/**
 * Definition of a single table column.
 *
 * @typeParam T - The row model the table renders.
 */
export interface ColumnDef<T = unknown> {
  /** Unique column id. Also used as the default property accessor on each row. */
  key: string;
  /** Text rendered in the header cell. */
  header: string;
  /**
   * Optional help text. When set, a small info icon appears to the right of the
   * header label and shows this description in a tooltip.
   */
  description?: string;
  /** When true the header becomes sortable. Defaults to `false`. */
  sortable?: boolean;
  /**
   * Built-in cell presentation when no custom `appGenericTableCell` template and
   * no `cellComponent` is set: `'text'` (default), `'uuid'` (monospace), or
   * `'date'` (`Date`, `YYYY-MM-DD`, or ISO datetimes like
   * `2026-07-21T18:30:00.123456Z`).
   */
  cellType?: GenericTableCellType;
  /**
   * When `cellType` is `'date'`, controls date vs date+time formatting.
   * Defaults to `'auto'`.
   */
  dateDisplay?: GenericTableDateDisplay;
  /**
   * Show a small Lucide copy control that copies the cell value to the clipboard.
   * Works with built-in cell types and plain text (not custom templates or
   * `cellComponent`).
   */
  copyable?: boolean;
  /**
   * Value accessor for the cell (e.g. nested fields). Defaults to `row[key]`.
   * Used by built-in formatters, copy, and as the `value` input for
   * `cellComponent`. Projected templates and `cellComponent` still win for display.
   */
  cell?: (row: T) => unknown;
  /**
   * Reusable cell component rendered via `NgComponentOutlet`.
   * Receives `value`, `row`, and `column` inputs (see {@link GenericTableCellComponentInputs}).
   * Ignored when a projected `appGenericTableCell` template exists for this key.
   * `copyable` / built-in `cellType` do not apply — the component owns presentation.
   */
  cellComponent?: Type<unknown>;
  /**
   * Custom sort key from the row. When unset, sorts by the raw `row[key]`
   * value (dates → timestamp). Provide this for nested fields or computed keys.
   */
  sortAccessor?: (row: T) => string | number;
  /** When `false` the column is always visible and hidden from the toggle. Defaults to `true`. */
  hideable?: boolean;
  /** Initial visibility of the column. Defaults to `true`. */
  visible?: boolean;
  /** Fixed preferred width, e.g. `'120px'` or `'20%'`. With `minWidth`, acts as a max. */
  width?: string;
  /**
   * Minimum column width, e.g. `'50px'` or `'0px'`. The column never shrinks below
   * this. With `width`, the track is `minmax(minWidth, width)` so it can shrink.
   * Only the last column grows to fill leftover container width.
   */
  minWidth?: string;
  /** Horizontal alignment of header and cells. Defaults to `'left'`. */
  align?: 'left' | 'center' | 'right';
}

/**
 * How the table sizes itself vertically.
 *
 * - `'auto'`: the body grows with its rows up to the default max height (480px), then scrolls.
 * - `'fill'`: sizes to its rows up to the remaining flex-column space, then scrolls.
 *   Virtualized tables ignore `maxHeight` and use the full allocation.
 * - `'parent'`: sizes to its rows up to the parent's height, then scrolls. Ignores
 *   `height` and `maxHeight`. Virtualized tables use the full parent allocation.
 *
 * `'fill'` and `'parent'` both scroll the body once rows exceed the available
 * height, and both require the parent to resolve a height (see the README).
 */
export type GenericTableHeightMode = 'auto' | 'fill' | 'parent';

/**
 * Context passed to a custom cell template projected with `appGenericTableCell`.
 *
 * @typeParam T - The row model the table renders.
 */
export interface GenericTableCellContext<T = unknown> {
  /** The row for the current cell (default template variable). */
  $implicit: T;
  /** Alias of `$implicit` for readability: `let-row="row"`. */
  row: T;
}

/**
 * Payload for `(exportRequest)`. Use when rows live on the server and the parent
 * must load the full dataset before the CSV can be built.
 *
 * @typeParam T - The row model the table renders.
 */
export interface GenericTableExportRequest<T = unknown> {
  /** Filename that will be used for the download (includes `.csv` when applicable). */
  fileName: string;
  /** Call with the full row set to download the CSV. */
  complete: (rows: readonly T[]) => void;
}
