import type { GenericTableCellType, GenericTableDateDisplay } from './generic-table-cell.types';

export interface ColumnDef<T = unknown> {

  key: string;

  header: string;

  description?: string;

  sortable?: boolean;

  cellType?: GenericTableCellType;

  dateDisplay?: GenericTableDateDisplay;

  copyable?: boolean;

  cell?: (row: T) => unknown;

  sortAccessor?: (row: T) => string | number;

  hideable?: boolean;

  visible?: boolean;

  width?: string;

  minWidth?: string;

  align?: 'left' | 'center' | 'right';
}

export type GenericTableHeightMode = 'auto' | 'fill' | 'parent';

export interface GenericTableCellContext<T = unknown> {

  $implicit: T;

  row: T;
}

export interface GenericTableExportRequest<T = unknown> {

  fileName: string;

  complete: (rows: readonly T[]) => void;
}
