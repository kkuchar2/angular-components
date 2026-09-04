import type { Type } from '@angular/core';
import type { LucideIconInput } from '@lucide/angular';

import type { GenericTableCellType, GenericTableDateDisplay } from './generic-table-cell.types';

export interface GenericTableRowAction<T = unknown> {
  id: string;
  label: string;
  icon?: LucideIconInput;
  disabled?: boolean | ((row: T) => boolean);
  danger?: boolean;
  hidden?: boolean | ((row: T) => boolean);
  dividerBefore?: boolean;
}

export interface GenericTableRowActionEvent<T = unknown> {
  actionId: string;
  row: T;
}

/** Type alias (not interface) so it stays assignable to `ngComponentOutletInputs`. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- needs an implicit index signature
export type GenericTableCellComponentInputs<T = unknown> = {
  value: unknown;
  row: T;
  column: ColumnDef<T>;
};

export interface ColumnToggleGroup<T = unknown> {
  id: string;
  label?: string;
  getValues: (row: T) => string | readonly string[] | null | undefined;
}

export interface ColumnToggleConfig<T = unknown> {
  groups: ColumnToggleGroup<T>[];
}

export type GenericTableAlign = 'left' | 'center' | 'right';

export interface ColumnDef<T = unknown> {
  key: string;
  header: string;
  description?: string;
  sortable?: boolean;
  searchable?: boolean;
  toggleable?: boolean | ColumnToggleConfig<T>;
  cellType?: GenericTableCellType;
  dateDisplay?: GenericTableDateDisplay;
  copyable?: boolean;
  cell?: (row: T) => unknown;
  cellComponent?: Type<unknown>;
  sortAccessor?: (row: T) => string | number;
  splitByNewline?: boolean;
  hideable?: boolean;
  visible?: boolean;
  width?: string;
  minWidth?: string;
  align?: GenericTableAlign;
}

export type GenericTableHeightMode = 'auto' | 'fill' | 'parent';

export type GenericTableColumnToggle = 'menu' | 'chips' | 'none';

export interface GenericTableCellContext<T = unknown> {
  $implicit: T;
  row: T;
}

export interface GenericTableExportRequest<T = unknown> {
  fileName: string;
  complete: (rows: readonly T[]) => void;
}

export interface GenericTableSort {
  active: string;
  direction: 'asc' | 'desc' | '';
}

export interface GenericTablePageEvent {
  pageIndex: number;
  previousPageIndex: number;
  pageSize: number;
  length: number;
}

export interface GenericTableFilterChange {
  text: Readonly<Record<string, string>>;
  toggles: Readonly<Record<string, readonly string[]>>;
}
