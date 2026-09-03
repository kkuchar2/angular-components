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

export interface GenericTableCellComponentInputs<T = unknown> {

  value: unknown;

  row: T;

  column: ColumnDef<T>;
}

export interface ColumnToggleGroup<T = unknown> {

  id: string;

  label?: string;

  getValues: (row: T) => string | readonly string[] | null | undefined;
}

export interface ColumnToggleConfig<T = unknown> {
  groups: ColumnToggleGroup<T>[];
}

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

export const GENERIC_TABLE_ROW_ACTIONS_TRACK = '48px';
