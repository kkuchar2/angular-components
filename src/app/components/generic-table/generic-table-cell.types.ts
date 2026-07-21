/**
 * Built-in cell presentations for `ColumnDef.cellType`.
 * Custom `appGenericTableCell` templates still override these.
 */
export type GenericTableCellType = 'text' | 'uuid' | 'date';

/**
 * How a `date` cell formats its value.
 *
 * - `'auto'`: date-only strings / midnight dates → locale date; otherwise date+time
 * - `'date'`: always locale date
 * - `'datetime'`: always locale date + time
 */
export type GenericTableDateDisplay = 'auto' | 'date' | 'datetime';
