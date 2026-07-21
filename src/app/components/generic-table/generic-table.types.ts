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
  /** When true the header becomes sortable. Defaults to `false`. */
  sortable?: boolean;
  /** Custom text formatter for the cell. Defaults to `row[key]`. */
  cell?: (row: T) => string | number;
  /** Custom value used when sorting. Defaults to `cell`, then `row[key]`. */
  sortAccessor?: (row: T) => string | number;
  /** When `false` the column is always visible and hidden from the toggle. Defaults to `true`. */
  hideable?: boolean;
  /** Initial visibility of the column. Defaults to `true`. */
  visible?: boolean;
  /** Fixed column width, e.g. `'120px'` or `'20%'`. */
  width?: string;
  /** Minimum column width, e.g. `'120px'`. The column never shrinks below this. */
  minWidth?: string;
  /** Horizontal alignment of header and cells. Defaults to `'left'`. */
  align?: 'left' | 'center' | 'right';
}

/**
 * How the table sizes itself vertically.
 *
 * - `'auto'`: the body grows with its rows up to the default max height (480px), then scrolls.
 * - `'fill'`: the body fills the remaining space of a flex-column parent
 *   (`flex: 1`). Use when the table sits next to other content in a sized column.
 * - `'parent'`: the body sizes to its rows up to the parent's height, then scrolls.
 *   Ignores `height` and `maxHeight`. When the parent is shorter than `minHeight`,
 *   the scroll body stays at `minHeight`.
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
