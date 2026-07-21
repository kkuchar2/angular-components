import { NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  TemplateRef,
  TrackByFunction,
  untracked,
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

/** Default scroll-body cap; mirrored by `--gt-max-height` in the component stylesheet. */
const DEFAULT_MAX_HEIGHT_PX = 480;

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
    '[class.generic-table-host--bounded]': 'isBoundedHeightMode()',
    '[class.generic-table-host--virtualized]': 'virtualized()',
    '[class.generic-table-host--disabled]': 'disabled()',
    '[style.--gt-bounded-max-height.px]': 'boundedMaxHeightPx()',
  },
})
export class GenericTableComponent<T = unknown> {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private scrollEndTimer: ReturnType<typeof setTimeout> | null = null;
  private layoutSyncFrame: number | null = null;
  private virtualResizeObserver: ResizeObserver | null = null;
  private boundedResizeObserver: ResizeObserver | null = null;
  private observedVirtualViewport: HTMLElement | null = null;
  private observedBoundedTargets = new Set<HTMLElement>();

  /** True while the scroll body is moving; suppresses row hover styling. */
  readonly isScrolling = signal(false);

  /** Column definitions in display order. */
  readonly columns = input.required<ColumnDef<T>[]>();
  /** Row data for the current view. Client-side when `serverSide` is false. */
  readonly data = input.required<readonly T[]>();
  /** Show a paginator. When `false` the table body scrolls instead. Ignored when `virtualized`. */
  readonly paginated = input(false);
  /**
   * Server-side pagination: pass only the current page in `data`, set `totalCount` to the
   * full result size, and fetch new rows in `(pageChange)`. Requires `paginated`.
   * Sorting remains client-side over the current page unless you handle `(sortChange)`.
   */
  readonly serverSide = input(false);
  /** Total row count on the server (used when `serverSide` is true). */
  readonly totalCount = input(0);
  /** Current page index, zero-based (used when `serverSide` is true). */
  readonly pageIndex = input(0);
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
  /** Fade the table and block all interaction (sort, pagination, column toggle, row click). */
  readonly disabled = input(false);
  /**
   * How the table sizes vertically:
   * - `'auto'` (default): grows with content up to the default max height (480px), then scrolls.
   * - `'fill'`: sizes to row content up to the remaining flex-column space; scrolls
   *   when rows exceed that space. Honors `minHeight` when the allocation is shorter.
   * - `'parent'`: sizes to row content up to the parent's height; scrolls when rows
   *   exceed that space. Ignores `height` and `maxHeight`. Honors `minHeight` when
   *   the parent is shorter than that floor.
   */
  readonly heightMode = input<GenericTableHeightMode>('auto');
  /** Exact, fixed height for the scroll body, e.g. `'320px'`. Ignored when `heightMode` is `'parent'`. */
  readonly height = input<string | null>(null);
  /** Caps the scroll body height, e.g. `'320px'`. Defaults to `480px` via `--gt-max-height`. Ignored in `'fill'` / `'parent'` modes. */
  readonly maxHeight = input<string | null>(null);
  /** Minimum scroll body height, e.g. `'200px'`. In `'fill'` / `'parent'` modes, never shrinks below this when the available space is shorter. */
  readonly minHeight = input<string | null>(null);

  readonly isParentMode = computed(() => this.heightMode() === 'parent');
  readonly isFillMode = computed(() => !this.isFixed() && this.heightMode() === 'fill');
  readonly isBoundedHeightMode = computed(() => this.isParentMode() || this.isFillMode());
  readonly isFixed = computed(() => !this.isParentMode() && this.height() != null);
  /** Fixed scroll-body height; suppressed in `'parent'` mode. */
  readonly scrollBodyHeight = computed(() => (this.isParentMode() ? null : this.height()));
  readonly showPaginator = computed(() => this.paginated() && !this.virtualized());
  readonly isServerSidePagination = computed(() => this.serverSide() && this.showPaginator());
  readonly virtualMinBufferPx = computed(() => this.rowHeight() * 10);
  readonly virtualMaxBufferPx = computed(() => this.rowHeight() * 20);
  /** Measured header track height for virtual viewport sizing. */
  readonly virtualHeaderHeightPx = signal(56);
  /** Available vertical space for `'fill'` / `'parent'` modes. */
  readonly boundedAvailableHeightPx = signal<number | null>(null);
  /** Non-scroll chrome (toggle, paginator, gaps) for bounded height modes. */
  readonly boundedChromeHeightPx = signal(0);
  readonly boundedMaxHeightPx = computed(() => {
    if (!this.isBoundedHeightMode()) {
      return null;
    }

    return this.boundedAvailableHeightPx();
  });
  /**
   * Virtual viewport height when not fixed: content height capped by max height (auto)
   * or bounded space (`fill` / `parent`). `null` lets CSS flex sizing take over.
   */
  readonly virtualViewportHeightPx = computed(() => {
    if (this.isFixed()) {
      return null;
    }

    const rowCount = Math.max(this.data().length, 1);
    const bodyContent = rowCount * this.rowHeight();

    if (this.isBoundedHeightMode()) {
      const available = this.boundedAvailableHeightPx();

      if (available == null) {
        return bodyContent;
      }

      const fillHeight = Math.max(
        0,
        available - this.boundedChromeHeightPx() - this.virtualHeaderHeightPx(),
      );

      return this.resolveBoundedScrollBodyHeightPx(bodyContent, fillHeight);
    }

    const maxBody = Math.max(
      this.rowHeight(),
      this.resolveMaxScrollHeightPx() - this.virtualHeaderHeightPx(),
    );

    return Math.min(bodyContent, maxBody);
  });
  readonly trackBy = input<TrackByFunction<T>>((_index, row) => row);

  readonly rowClick = output<T>();
  readonly sortChange = output<Sort>();
  readonly pageChange = output<PageEvent>();

  readonly dataSource = new MatTableDataSource<T>();

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);
  private readonly virtualHeaderTrack = viewChild<ElementRef<HTMLElement>>('virtualHeaderTrack');
  private readonly virtualViewport = viewChild<CdkVirtualScrollViewport>('virtualViewport');
  private readonly virtualShell = viewChild<ElementRef<HTMLElement>>('virtualShell');
  private readonly cellDirectives = contentChildren(GenericTableCellDirective);
  private readonly cellContextCache = new WeakMap<object, GenericTableCellContext<T>>();

  readonly cellTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<GenericTableCellContext<T>>>();

    for (const directive of this.cellDirectives()) {
      templates.set(directive.columnKey(), directive.templateRef);
    }

    return templates;
  });

  readonly columnByKey = computed(() => {
    const map = new Map<string, ColumnDef<T>>();

    for (const column of this.columns()) {
      map.set(column.key, column);
    }

    return map;
  });

  readonly columnColStyles = computed(() => {
    const styles = new Map<string, Record<string, string>>();

    for (const column of this.columns()) {
      styles.set(column.key, this.buildColumnColStyles(column));
    }

    return styles;
  });

  readonly columnWidthStyles = computed(() => {
    const styles = new Map<string, Record<string, string>>();

    for (const column of this.columns()) {
      styles.set(column.key, this.buildColumnWidthStyles(column));
    }

    return styles;
  });

  readonly hideableColumns = computed(() =>
    this.columns().filter((column) => column.hideable !== false),
  );

  readonly visibleKeys = linkedSignal(() => {
    const keys = this.columns()
      .filter((column) => column.visible !== false)
      .map((column) => column.key);

    return new Set(keys);
  });

  readonly displayedColumns = computed(() =>
    this.columns()
      .filter((column) => column.hideable === false || this.visibleKeys().has(column.key))
      .map((column) => column.key),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.scrollEndTimer != null) {
        clearTimeout(this.scrollEndTimer);
      }

      if (this.layoutSyncFrame != null) {
        cancelAnimationFrame(this.layoutSyncFrame);
      }

      this.virtualResizeObserver?.disconnect();
      this.boundedResizeObserver?.disconnect();
    });

    this.virtualResizeObserver = new ResizeObserver(() => this.queueVirtualLayoutSync());
    this.boundedResizeObserver = new ResizeObserver(() => this.measureBoundedLayout());

    effect(() => {
      if (!this.isBoundedHeightMode()) {
        for (const target of this.observedBoundedTargets) {
          this.boundedResizeObserver?.unobserve(target);
        }

        this.observedBoundedTargets.clear();
        this.boundedAvailableHeightPx.set(null);
        this.boundedChromeHeightPx.set(0);
        return;
      }

      this.showPaginator();
      this.showColumnToggle();
      this.hideableColumns();
      this.data();

      const host = this.hostEl.nativeElement;
      const parent = host.parentElement;
      const targets = new Set<HTMLElement>();

      if (parent) {
        targets.add(parent);
      }

      if (this.isFillMode()) {
        targets.add(host);
      }

      for (const target of this.observedBoundedTargets) {
        if (!targets.has(target)) {
          this.boundedResizeObserver?.unobserve(target);
          this.observedBoundedTargets.delete(target);
        }
      }

      for (const target of targets) {
        if (!this.observedBoundedTargets.has(target)) {
          this.boundedResizeObserver?.observe(target);
          this.observedBoundedTargets.add(target);
        }
      }

      untracked(() => {
        requestAnimationFrame(() => this.measureBoundedLayout());
      });
    });

    effect(() => {
      if (!this.virtualized()) {
        if (this.observedVirtualViewport) {
          this.virtualResizeObserver?.unobserve(this.observedVirtualViewport);
          this.observedVirtualViewport = null;
        }

        return;
      }

      this.displayedColumns();
      this.columns();
      this.columnColStyles();
      this.data();
      this.virtualShell();
      this.virtualHeaderTrack();
      this.virtualViewport();

      const viewportEl = this.virtualViewport()?.elementRef.nativeElement;

      if (viewportEl && viewportEl !== this.observedVirtualViewport) {
        if (this.observedVirtualViewport) {
          this.virtualResizeObserver?.unobserve(this.observedVirtualViewport);
        }

        this.virtualResizeObserver?.observe(viewportEl);
        this.observedVirtualViewport = viewportEl;
      }

      this.queueVirtualLayoutSync();

      // Virtual rows can render a frame after the shell; retry once layout settles.
      untracked(() => {
        setTimeout(() => this.queueVirtualLayoutSync(), 0);
        setTimeout(() => this.queueVirtualLayoutSync(), 100);
      });
    });

    this.dataSource.sortingDataAccessor = (row, columnKey) => {
      const column = this.columnByKey().get(columnKey);

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
      const attachPaginator =
        this.showPaginator() && !this.isServerSidePagination();

      this.dataSource.paginator = attachPaginator ? (this.paginator() ?? null) : null;
    });
  }

  formatCell(column: ColumnDef<T>, row: T): string | number {
    if (column.cell) {
      return column.cell(row);
    }

    return this.getRowValue(row, column.key);
  }

  cellContext(row: T): GenericTableCellContext<T> {
    if (typeof row !== 'object' || row === null) {
      return { $implicit: row, row };
    }

    let context = this.cellContextCache.get(row);

    if (!context) {
      context = { $implicit: row, row };
      this.cellContextCache.set(row, context);
    }

    return context;
  }

  isColumnVisible(key: string): boolean {
    return this.visibleKeys().has(key);
  }

  onToggleColumns(event: MatChipListboxChange): void {
    if (this.disabled()) {
      return;
    }

    if (Array.isArray(event.value)) {
      this.visibleKeys.set(new Set(event.value));
    }
  }

  onSortChange(sort: Sort): void {
    if (!this.disabled()) {
      this.sortChange.emit(sort);
    }
  }

  onPageChange(event: PageEvent): void {
    if (!this.disabled()) {
      this.pageChange.emit(event);
    }
  }

  onRowClick(row: T): void {
    if (this.disabled() || !this.rowClickable()) {
      return;
    }

    this.rowClick.emit(row);
  }

  onScroll(): void {
    this.isScrolling.set(true);

    if (this.scrollEndTimer != null) {
      clearTimeout(this.scrollEndTimer);
    }

    this.scrollEndTimer = setTimeout(() => {
      this.isScrolling.set(false);
      this.scrollEndTimer = null;
    }, 150);
  }

  onVirtualScroll(event: Event): void {
    this.onScroll();

    const viewport = event.currentTarget as HTMLElement;
    const headerTrack = this.virtualHeaderTrack()?.nativeElement;

    if (headerTrack && headerTrack.scrollLeft !== viewport.scrollLeft) {
      headerTrack.scrollLeft = viewport.scrollLeft;
    }
  }

  private queueVirtualLayoutSync(): void {
    if (this.layoutSyncFrame != null) {
      cancelAnimationFrame(this.layoutSyncFrame);
    }

    // Two frames lets mat-table finish applying column widths before we measure.
    this.layoutSyncFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.layoutSyncFrame = null;
        this.syncVirtualTableLayout();
      });
    });
  }

  private syncVirtualTableLayout(): void {
    const viewport = this.virtualViewport()?.elementRef.nativeElement;
    const shell = this.virtualShell()?.nativeElement;
    const headerTrack = this.virtualHeaderTrack()?.nativeElement;

    if (!viewport || !shell || !headerTrack) {
      return;
    }

    const headerTable = headerTrack.querySelector('table');
    const bodyTable = viewport.querySelector('table');

    if (!(headerTable instanceof HTMLElement) || !(bodyTable instanceof HTMLElement)) {
      return;
    }

    const headerHeight = headerTrack.offsetHeight;

    if (headerHeight > 0) {
      this.virtualHeaderHeightPx.set(headerHeight);
    }

    const gutter = viewport.offsetWidth - viewport.clientWidth;
    const contentWidth = viewport.clientWidth;

    this.setShellStyle(shell, '--gt-virtual-scrollbar-gutter', `${gutter}px`);

    if (this.data().length === 0) {
      this.syncEmptyVirtualTableLayout(
        shell,
        headerTable,
        bodyTable,
        headerTrack,
        contentWidth,
      );
      this.measureBoundedLayout();
      return;
    }

    this.resetSyncedColumnWidths(headerTable, headerTrack, bodyTable);
    this.setShellStyle(shell, '--gt-virtual-table-width', `${contentWidth}px`);
    // Flush layout so body cells reflect the cleared widths before we measure.
    void bodyTable.offsetWidth;

    const widths = this.syncVirtualColumnWidths(headerTable, bodyTable, viewport, headerTrack);
    const summedWidths = widths?.reduce((sum, width) => sum + width, 0) ?? 0;
    const tableWidth = this.resolveVirtualTableWidth(contentWidth, summedWidths);

    if (tableWidth > contentWidth + 1) {
      this.setShellStyle(shell, '--gt-virtual-table-width', `${tableWidth}px`);
      this.syncVirtualColumnWidths(headerTable, bodyTable, viewport, headerTrack);
    }

    this.measureBoundedLayout();
  }

  /** Avoid sub-pixel false positives from scrollWidth / padding when columns still fit. */
  private resolveVirtualTableWidth(contentWidth: number, summedWidths: number): number {
    if (summedWidths <= contentWidth + 1) {
      return contentWidth;
    }

    return Math.ceil(summedWidths);
  }

  private setShellStyle(shell: HTMLElement, property: string, value: string): void {
    if (shell.style.getPropertyValue(property) !== value) {
      shell.style.setProperty(property, value);
    }
  }

  private syncEmptyVirtualTableLayout(
    shell: HTMLElement,
    headerTable: HTMLElement,
    bodyTable: HTMLElement,
    headerTrack: HTMLElement,
    contentWidth: number,
  ): void {
    this.resetSyncedColumnWidths(headerTable, headerTrack, bodyTable);

    const widths = this.computeVirtualColumnWidths(contentWidth);
    const summedWidths = widths.reduce((sum, width) => sum + width, 0);
    const tableWidth = this.resolveVirtualTableWidth(contentWidth, summedWidths);

    this.setShellStyle(shell, '--gt-virtual-table-width', `${tableWidth}px`);
    this.applyVirtualColumnWidths(widths, headerTable, headerTrack, bodyTable);
  }

  private computeVirtualColumnWidths(contentWidth: number): number[] {
    const keys = this.displayedColumns();
    const widths = new Array<number>(keys.length).fill(0);
    const flexIndices: number[] = [];
    let fixedTotal = 0;

    keys.forEach((key, index) => {
      const column = this.columnByKey().get(key);

      if (column?.width) {
        widths[index] = this.parseLengthToPx(column.width, contentWidth);
        fixedTotal += widths[index];
        return;
      }

      if (column?.minWidth && this.isPositiveLength(column.minWidth)) {
        widths[index] = this.parseLengthToPx(column.minWidth, contentWidth);
        fixedTotal += widths[index];
        return;
      }

      flexIndices.push(index);
    });

    const remaining = Math.max(0, contentWidth - fixedTotal);
    const flexWidth = flexIndices.length > 0 ? remaining / flexIndices.length : 0;

    for (const index of flexIndices) {
      widths[index] = flexWidth;
    }

    return widths;
  }

  private parseLengthToPx(value: string, referenceWidth: number): number {
    const trimmed = value.trim();

    if (trimmed.endsWith('vh')) {
      const vh = Number.parseFloat(trimmed);

      return Number.isNaN(vh) ? 0 : (globalThis.innerHeight * vh) / 100;
    }

    if (trimmed.endsWith('rem')) {
      const rem = Number.parseFloat(trimmed);
      const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

      return Number.isNaN(rem) ? 0 : rem * (Number.isNaN(rootSize) ? 16 : rootSize);
    }

    if (trimmed.endsWith('%')) {
      const percent = Number.parseFloat(trimmed);

      return Number.isNaN(percent) ? 0 : (referenceWidth * percent) / 100;
    }

    const pixels = Number.parseFloat(trimmed);

    return Number.isNaN(pixels) ? 0 : pixels;
  }

  private resolveMaxScrollHeightPx(): number {
    const maxHeight = this.maxHeight();

    if (!maxHeight) {
      return DEFAULT_MAX_HEIGHT_PX;
    }

    const shell = this.virtualShell()?.nativeElement;
    const referenceWidth = shell?.clientWidth ?? globalThis.innerWidth;
    const parsed = this.parseLengthToPx(maxHeight, referenceWidth);

    return parsed > 0 ? parsed : DEFAULT_MAX_HEIGHT_PX;
  }

  private resolveMinScrollHeightPx(): number {
    const minHeight = this.minHeight();

    if (!minHeight) {
      return 0;
    }

    const referenceWidth = this.hostEl.nativeElement.clientWidth || globalThis.innerWidth;
    const parsed = this.parseLengthToPx(minHeight, referenceWidth);

    return parsed > 0 ? parsed : 0;
  }

  /** Shrinks to row content, caps at parent space, floors at minHeight when parent is short. */
  private resolveParentScrollBodyHeightPx(contentHeight: number, fillHeight: number): number {
    const minHeight = this.resolveMinScrollHeightPx();

    if (fillHeight < minHeight) {
      return Math.max(contentHeight, minHeight);
    }

    return Math.min(contentHeight, fillHeight);
  }

  private measureParentLayout(): void {
    if (!this.isParentMode()) {
      return;
    }

    const host = this.hostEl.nativeElement;
    const parent = host.parentElement;

    if (!parent) {
      return;
    }

    this.parentAvailableHeightPx.set(parent.clientHeight);

    const tableRoot = host.querySelector('.generic-table');
    const scrollBody = host.querySelector('.generic-table__scroll, .generic-table__virtual-shell');

    if (tableRoot instanceof HTMLElement && scrollBody instanceof HTMLElement) {
      this.parentChromeHeightPx.set(Math.max(0, tableRoot.clientHeight - scrollBody.clientHeight));
    }
  }

  private resetSyncedColumnWidths(
    headerTable: HTMLElement,
    headerTrack: HTMLElement,
    bodyTable?: HTMLElement | null,
  ): void {
    headerTable.querySelectorAll('col').forEach((col) => {
      if (col instanceof HTMLElement) {
        col.style.width = '';
      }
    });

    bodyTable?.querySelectorAll('col').forEach((col) => {
      if (col instanceof HTMLElement) {
        col.style.width = '';
      }
    });

    headerTrack.querySelectorAll('.mat-mdc-header-cell').forEach((cell) => {
      if (!(cell instanceof HTMLElement)) {
        return;
      }

      cell.style.width = '';
      cell.style.maxWidth = '';
      cell.style.minWidth = '';
      cell.style.paddingLeft = '';
      cell.style.paddingRight = '';
      cell.style.textAlign = '';
    });
  }

  private syncVirtualColumnWidths(
    headerTable: HTMLElement,
    bodyTable: HTMLElement,
    viewport: HTMLElement,
    headerTrack: HTMLElement,
  ): number[] | null {
    const bodyRow = viewport.querySelector('.mat-mdc-row');

    if (!bodyRow) {
      return null;
    }

    const bodyCells = bodyRow.querySelectorAll('.mat-mdc-cell');

    if (!bodyCells.length) {
      return null;
    }

    const widths = Array.from(bodyCells)
      .filter((cell): cell is HTMLElement => cell instanceof HTMLElement)
      .map((cell) => cell.getBoundingClientRect().width);

    this.applyVirtualColumnWidths(widths, headerTable, headerTrack, bodyTable, bodyCells);
    return widths;
  }

  private applyVirtualColumnWidths(
    widths: readonly number[],
    headerTable: HTMLElement,
    headerTrack: HTMLElement,
    bodyTable?: HTMLElement | null,
    referenceCells?: NodeListOf<Element>,
  ): void {
    const headerCols = headerTable.querySelectorAll('col');
    const headerCells = headerTrack.querySelectorAll('.mat-mdc-header-cell');
    const bodyCols = bodyTable?.querySelectorAll('col');

    widths.forEach((width, index) => {
      const widthPx = `${width}px`;
      const headerCol = headerCols[index];
      const headerCell = headerCells[index];
      const bodyCol = bodyCols?.[index];
      const referenceCell = referenceCells?.[index];

      if (headerCol instanceof HTMLElement) {
        headerCol.style.width = widthPx;
      }

      if (bodyCol instanceof HTMLElement) {
        bodyCol.style.width = widthPx;
      }

      if (!(headerCell instanceof HTMLElement)) {
        return;
      }

      headerCell.style.width = widthPx;
      headerCell.style.maxWidth = widthPx;

      if (referenceCell instanceof HTMLElement) {
        const referenceStyle = getComputedStyle(referenceCell);
        headerCell.style.paddingLeft = referenceStyle.paddingLeft;
        headerCell.style.paddingRight = referenceStyle.paddingRight;
        headerCell.style.textAlign = referenceStyle.textAlign;
        return;
      }

      const columnKey = this.displayedColumns()[index];
      const column = this.columnByKey().get(columnKey);

      if (column?.align) {
        headerCell.style.textAlign = column.align;
      }
    });
  }

  rowStripeClass(index: number): 'generic-table__row--even' | 'generic-table__row--odd' {
    return index % 2 === 0 ? 'generic-table__row--even' : 'generic-table__row--odd';
  }

  private buildColumnColStyles(column: ColumnDef<T>): Record<string, string> {
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

  private buildColumnWidthStyles(column: ColumnDef<T>): Record<string, string> {
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

  private getRowValue(row: T, key: string): string | number {
    if (typeof row !== 'object' || row === null || !(key in row)) {
      return '';
    }

    const value = (row as Record<string, unknown>)[key];
    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }
}
