import { NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  input,
  linkedSignal,
  output,
  TemplateRef,
  TrackByFunction,
  viewChild,
} from '@angular/core';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { GenericTableCellDirective } from './generic-table-cell.directive';
import { ColumnDef, GenericTableCellContext, GenericTableHeightMode } from './generic-table.types';

/**
 * A configurable, signal-based table built on Angular Material's `mat-table`.
 *
 * Features: per-column sorting, optional pagination (or a scrollable body),
 * a chip-based column visibility toggle, custom cell templates, optional row
 * click, and a centered empty state.
 *
 * @typeParam T - The row model. Inferred from the `data`/`columns` inputs.
 */
@Component({
  selector: 'app-generic-table',
  imports: [
    NgStyle,
    NgTemplateOutlet,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
  ],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'generic-table-host',
    '[class.generic-table-host--fill]': 'isFillMode()',
    '[class.generic-table-host--parent]': 'isParentMode()',
    '[class.generic-table-host--virtualized]': 'virtualized()',
  },
})
export class GenericTableComponent<T = unknown> {
  /** Column definitions in display order. */
  readonly columns = input.required<ColumnDef<T>[]>();
  /** Row data. Sorting and pagination are applied client-side. */
  readonly data = input.required<readonly T[]>();
  /** Show a paginator. When `false` the table body scrolls instead. Ignored when `virtualized`. */
  readonly paginated = input(false);
  /**
   * Render rows with CDK virtual scroll (only visible rows in the DOM).
   * Requires a bounded scroll height (`height`, `maxHeight`, or `heightMode` `'fill'`/`'parent'`)
   * and a fixed `rowHeight`. Mutually exclusive with `paginated`.
   */
  readonly virtualized = input(false);
  /** Fixed row height in pixels. Required when `virtualized` is true. Defaults to `48`. */
  readonly rowHeight = input(48);
  /** Initial page size (used when `paginated` is true). */
  readonly pageSize = input(10);
  /** Page size options offered by the paginator. */
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  /** Show the chip list that toggles hideable columns. */
  readonly showColumnToggle = input(true);
  /** Message shown when there are no rows. */
  readonly emptyMessage = input('No data available');
  /** Emit `rowClick` and apply hover styling when true. */
  readonly rowClickable = input(false);
  /**
   * How the table sizes vertically:
   * - `'auto'` (default): grows with content; pair with `maxHeight` to cap it.
   * - `'fill'`: fills the remaining space of a flex-column parent (`flex: 1`).
   * - `'parent'`: fills the parent's full height (`height: 100%`).
   *
   * In `'fill'`/`'parent'` the body scrolls once rows exceed the available height,
   * and both require the parent to resolve a height (see the component README).
   */
  readonly heightMode = input<GenericTableHeightMode>('auto');
  /**
   * Exact, fixed height for the scroll body, e.g. `'320px'`. When set it wins over
   * `heightMode`: the body is always this tall and scrolls when rows overflow.
   */
  readonly height = input<string | null>(null);
  /**
   * Caps the scroll body height, e.g. `'320px'`. Composes with any `heightMode`
   * (e.g. `'fill'` + `maxHeight` fills remaining space but never grows past the cap).
   */
  readonly maxHeight = input<string | null>(null);

  /** A fixed `height` was provided, so the body is sized explicitly. */
  readonly isFixed = computed(() => this.height() != null);
  /** The body uses a flex fill chain (`'fill'` or `'parent'`) instead of content height. */
  readonly isFilling = computed(() => !this.isFixed() && this.heightMode() !== 'auto');
  /** Fill the remaining space of a flex-column parent. */
  readonly isFillMode = computed(() => this.isFilling() && this.heightMode() === 'fill');
  /** Fill the parent's full height. */
  readonly isParentMode = computed(() => this.isFilling() && this.heightMode() === 'parent');
  /** Paginator is shown only when pagination is on and virtualization is off. */
  readonly showPaginator = computed(() => this.paginated() && !this.virtualized());
  /** Buffer sizes for the virtual scroll viewport, derived from `rowHeight`. */
  readonly virtualMinBufferPx = computed(() => this.rowHeight() * 10);
  readonly virtualMaxBufferPx = computed(() => this.rowHeight() * 20);
  /**
   * `trackBy` for rows (improves rendering and preserves DOM state).
   * Defaults to identity tracking, matching `mat-table`'s built-in behavior.
   */
  readonly trackBy = input<TrackByFunction<T>>((_index, row) => row);

  /** Emitted when a row is clicked (only when `rowClickable` is true). */
  readonly rowClick = output<T>();
  /** Emitted when the sort state changes. */
  readonly sortChange = output<Sort>();
  /** Emitted when the page changes. */
  readonly pageChange = output<PageEvent>();

  readonly dataSource = new MatTableDataSource<T>();

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);
  private readonly cellDirectives = contentChildren(GenericTableCellDirective);

  private readonly cellTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<GenericTableCellContext<T>>>();

    for (const directive of this.cellDirectives()) {
      templates.set(directive.columnKey(), directive.templateRef);
    }

    return templates;
  });

  /** Columns that appear in the visibility toggle. */
  readonly hideableColumns = computed(() =>
    this.columns().filter((column) => column.hideable !== false),
  );

  /** Set of currently visible column keys; reset whenever `columns` changes. */
  readonly visibleKeys = linkedSignal(() => {
    const keys = this.columns()
      .filter((column) => column.visible !== false)
      .map((column) => column.key);

    return new Set(keys);
  });

  /** Keys of the columns rendered right now, in order. */
  readonly displayedColumns = computed(() =>
    this.columns()
      .filter((column) => column.hideable === false || this.visibleKeys().has(column.key))
      .map((column) => column.key),
  );

  constructor() {
    this.dataSource.sortingDataAccessor = (row, columnKey) => {
      const column = this.columns().find((item) => item.key === columnKey);

      if (!column) {
        return '';
      }

      if (column.sortAccessor) {
        return column.sortAccessor(row);
      }

      if (column.cell) {
        return column.cell(row);
      }

      return this.getRowValue(row, columnKey);
    };

    effect(() => {
      this.dataSource.data = [...this.data()];
    });

    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
    });

    effect(() => {
      this.dataSource.paginator = this.showPaginator() ? (this.paginator() ?? null) : null;
    });
  }

  /** Column definition for a displayed key, if it exists. */
  getColumnByKey(key: string): ColumnDef<T> | undefined {
    return this.columns().find((column) => column.key === key);
  }

  /** Width hints for `<col>` elements (used with `table-layout: fixed`). */
  columnColStyles(column: ColumnDef<T>): Record<string, string> {
    const styles: Record<string, string> = {};

    if (column.width) {
      styles['width'] = column.width;
      return styles;
    }

    if (column.minWidth && this.isPositiveLength(column.minWidth)) {
      styles['width'] = column.minWidth;
    }

    return styles;
  }

  /** Inline width constraints applied to header and body cells. */
  columnWidthStyles(column: ColumnDef<T>): Record<string, string> {
    const styles: Record<string, string> = {};

    if (column.width) {
      styles['width'] = column.width;
      styles['max-width'] = column.width;
    }

    if (column.minWidth !== undefined) {
      styles['min-width'] = column.minWidth;
    } else if (column.width) {
      styles['min-width'] = column.width;
    }

    return styles;
  }

  private isPositiveLength(value: string): boolean {
    const parsed = Number.parseFloat(value);
    return !Number.isNaN(parsed) && parsed > 0;
  }

  /** Resolve the plain-text value for a cell without a custom template. */
  formatCell(column: ColumnDef<T>, row: T): string | number {
    if (column.cell) {
      return column.cell(row);
    }

    return this.getRowValue(row, column.key);
  }

  /** The custom template for a column, or `null` to fall back to text. */
  getCellTemplate(key: string): TemplateRef<GenericTableCellContext<T>> | null {
    return this.cellTemplates().get(key) ?? null;
  }

  /** Build the context object handed to a custom cell template. */
  cellContext(row: T): GenericTableCellContext<T> {
    return { $implicit: row, row };
  }

  isColumnVisible(key: string): boolean {
    return this.visibleKeys().has(key);
  }

  onToggleColumns(event: MatChipListboxChange): void {
    if (Array.isArray(event.value)) {
      this.visibleKeys.set(new Set(event.value));
    }
  }

  onRowClick(row: T): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }

  /** Zebra-striping class based on the row's data index (works with virtual scroll). */
  rowStripeClass(index: number): 'generic-table__row--even' | 'generic-table__row--odd' {
    return index % 2 === 0 ? 'generic-table__row--even' : 'generic-table__row--odd';
  }

  private getRowValue(row: T, key: string): string | number {
    if (typeof row !== 'object' || row === null || !(key in row)) {
      return '';
    }

    const value = (row as Record<string, unknown>)[key];
    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }
}
