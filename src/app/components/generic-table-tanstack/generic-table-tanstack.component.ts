import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  TrackByFunction,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { LucideDownload, LucideDynamicIcon, LucideFunnel, LucideX } from '@lucide/angular';
import {
  createAngularTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef as TanstackColumnDef,
  type PaginationState,
  type Row,
  type SortingState,
} from '@tanstack/angular-table';
import { injectVirtualizer } from '@tanstack/angular-virtual';

import { ContextMenuComponent, type ContextMenuItem } from '../context-menu';
import type { ContextMenuDetailField, ContextMenuVariant } from '../context-menu';
import { GenericTableCellDirective } from './generic-table-cell.directive';
import { resolveCellRawValue, resolveSortValue } from './generic-table-cell-format';
import { GenericTableCellValueComponent } from './generic-table-cell-value.component';
import { GenericTableColumnsMenuComponent } from './generic-table-columns-menu.component';
import {
  GenericTableFilterUiState,
  GenericTableFilterValues,
  applyFilters,
  isColumnToggleable,
  resolveToggleGroups,
} from './generic-table-filter-model';
import { GenericTableFiltersComponent } from './generic-table-filters.component';
import { GenericTableHeaderInfoComponent } from './generic-table-header-info.component';
import { GenericTablePaginatorComponent } from './generic-table-paginator.component';
import { GenericTableToolDirective } from './generic-table-tool.directive';
import {
  ColumnDef,
  GenericTableCellComponentInputs,
  GenericTableCellContext,
  GenericTableColumnToggle,
  GenericTableExportRequest,
  GenericTableFilterChange,
  GenericTableHeightMode,
  GenericTablePageEvent,
  GenericTableRowAction,
  GenericTableRowActionEvent,
  GenericTableSort,
} from './generic-table.types';

const FILTER_RAIL_MIN_WIDTH_PX = 720;
const DEFAULT_SCROLL_MAX_HEIGHT = '30rem';
const DEFAULT_RAIL_MAX_HEIGHT = '26rem';
const SCROLL_IDLE_MS = 150;

interface RenderRow<T> {
  row: T;
  index: number;
  offset: number | null;
  height: number | null;
}

interface RowMenuEntry {
  source: unknown;
  items: ContextMenuItem[];
  details: ContextMenuDetailField[];
  title: string | null;
}

@Component({
  selector: 'app-generic-table-tanstack',
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
    MatChipsModule,
    LucideDynamicIcon,
    ContextMenuComponent,
    GenericTableCellValueComponent,
    GenericTableColumnsMenuComponent,
    GenericTableFiltersComponent,
    GenericTableHeaderInfoComponent,
    GenericTablePaginatorComponent,
  ],
  templateUrl: './generic-table-tanstack.component.html',
  styleUrl: './generic-table-tanstack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gtt-host',
    '[class.gtt-host--fill]': "heightMode() === 'fill'",
    '[class.gtt-host--parent]': "heightMode() === 'parent'",
    '[class.gtt-host--disabled]': 'disabled()',
    '[style.min-height]': 'hostMinHeight()',
    '[style.max-height]': 'hostMaxHeight()',
    '[style.--gtt-row-height.px]': 'rowHeight()',
  },
})
export class GenericTableTanstackComponent<T = unknown> {
  private static instanceCount = 0;

  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private readonly cellContextCache = new WeakMap<object, GenericTableCellContext<T>>();
  private readonly cellInputsCache = new WeakMap<
    object,
    Map<string, GenericTableCellComponentInputs<T>>
  >();
  private readonly rowMenuCache = new WeakMap<object, RowMenuEntry>();

  private readonly coreRowModel = getCoreRowModel<T>();
  private readonly sortedRowModel = getSortedRowModel<T>();
  private readonly paginationRowModel = getPaginationRowModel<T>();

  private scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private hasEmittedFilters = false;

  readonly instanceId = `gtt-${++GenericTableTanstackComponent.instanceCount}`;
  readonly dialogTitleId = `${this.instanceId}-filters-title`;

  readonly LucideFunnel = LucideFunnel;
  readonly LucideDownload = LucideDownload;
  readonly LucideX = LucideX;

  readonly columns = input.required<ColumnDef<T>[]>();
  readonly data = input.required<readonly T[]>();

  readonly paginated = input(false);
  readonly serverSide = input(false);
  readonly totalCount = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);

  readonly virtualized = input(false);
  readonly rowHeight = input(40);
  readonly overscan = input(12);

  readonly columnToggle = input<GenericTableColumnToggle>('menu');
  readonly showExport = input(false);
  readonly exportFileName = input('table-export.csv');
  readonly exportData = input<readonly T[] | null>(null);

  readonly emptyMessage = input('No data available');
  readonly rowClickable = input(false);
  readonly striped = input(false);
  readonly disabled = input(false);

  readonly rowMenuVariant = input<ContextMenuVariant>('actions');
  readonly rowActions = input<GenericTableRowAction<T>[]>([]);
  readonly rowDetails = input<((row: T) => ContextMenuDetailField[]) | null>(null);
  readonly rowDetailsTitle = input<string | ((row: T) => string) | null>(null);

  readonly heightMode = input<GenericTableHeightMode>('auto');
  readonly height = input<string | null>(null);
  readonly maxHeight = input<string | null>(null);
  readonly minHeight = input<string | null>(null);
  readonly filterMaxHeight = input<string | null>(null);

  readonly trackBy = input<TrackByFunction<T>>((_index, row) => row);

  readonly rowClick = output<T>();
  readonly rowAction = output<GenericTableRowActionEvent<T>>();
  readonly sortChange = output<GenericTableSort>();
  readonly pageChange = output<GenericTablePageEvent>();
  readonly exportRequest = output<GenericTableExportRequest<T>>();
  readonly filtersChange = output<GenericTableFilterChange>();

  private readonly scrollElement = viewChild<ElementRef<HTMLElement>>('scrollElement');
  private readonly filtersDialog = viewChild<ElementRef<HTMLDialogElement>>('filtersDialog');
  private readonly cellDirectives = contentChildren(GenericTableCellDirective);
  private readonly projectedTools = contentChildren(GenericTableToolDirective);

  readonly filters = new GenericTableFilterValues();
  readonly draftFilters = new GenericTableFilterValues();
  readonly filterUi = new GenericTableFilterUiState();

  readonly sorting = signal<SortingState>([]);
  readonly isScrolling = signal(false);
  readonly filtersCollapsed = signal(false);
  readonly filtersDialogOpen = signal(false);
  readonly hostWidth = signal(0);

  readonly activePageSize = linkedSignal(() => Math.max(1, this.pageSize()));
  readonly clientPageIndex = signal(0);

  readonly visibleKeys = linkedSignal(
    () =>
      new Set(
        this.columns()
          .filter((column) => column.visible !== false)
          .map((column) => column.key),
      ),
  );

  readonly isBounded = computed(() => this.heightMode() !== 'auto');

  readonly hostMinHeight = computed(() => (this.isBounded() ? this.height() : null));

  readonly hostMaxHeight = computed(() => (this.isBounded() ? this.maxHeight() : null));

  readonly shellHeight = computed(() => (this.isBounded() ? null : this.height()));

  readonly scrollMaxHeight = computed(() => {
    if (this.isBounded() || this.height()) {
      return null;
    }

    return this.maxHeight() ?? DEFAULT_SCROLL_MAX_HEIGHT;
  });

  readonly railMaxHeight = computed(() =>
    this.isBounded() ? null : (this.filterMaxHeight() ?? DEFAULT_RAIL_MAX_HEIGHT),
  );

  readonly hideableColumns = computed(() =>
    this.columns().filter((column) => column.hideable !== false),
  );

  readonly displayedColumns = computed(() =>
    this.columns().filter(
      (column) => column.hideable === false || this.visibleKeys().has(column.key),
    ),
  );

  readonly searchableColumns = computed(() =>
    this.columns().filter((column) => column.searchable === true),
  );

  readonly toggleGroups = computed(() => resolveToggleGroups(this.columns()));

  readonly filterColumns = computed(() =>
    this.columns().filter(
      (column) => column.searchable === true || isColumnToggleable(column),
    ),
  );

  readonly hasFilters = computed(() => this.filterColumns().length > 0);

  readonly useFiltersDialog = computed(
    () => this.hasFilters() && this.hostWidth() > 0 && this.hostWidth() < FILTER_RAIL_MIN_WIDTH_PX,
  );

  readonly showRail = computed(
    () => this.hasFilters() && !this.useFiltersDialog() && !this.filtersCollapsed(),
  );

  readonly showColumnsMenu = computed(
    () => this.columnToggle() === 'menu' && this.hideableColumns().length > 0,
  );

  readonly showColumnChips = computed(
    () => this.columnToggle() === 'chips' && this.hideableColumns().length > 0,
  );

  readonly showToolbar = computed(
    () =>
      this.hasFilters() ||
      this.showColumnsMenu() ||
      this.showColumnChips() ||
      this.showExport() ||
      this.projectedTools().length > 0,
  );

  readonly showPaginator = computed(() => this.paginated() && !this.virtualized());
  readonly isServerPagination = computed(() => this.serverSide() && this.showPaginator());
  readonly isClientPagination = computed(() => this.showPaginator() && !this.serverSide());

  readonly hasRowActions = computed(
    () =>
      (this.rowMenuVariant() === 'actions' && this.rowActions().length > 0) ||
      (this.rowMenuVariant() === 'details' && this.rowDetails() != null),
  );

  readonly showFacetCounts = computed(() => !this.serverSide());

  private readonly filterResult = computed(() =>
    applyFilters(
      this.data(),
      this.searchableColumns(),
      this.toggleGroups(),
      this.filters.text(),
      this.filters.toggles(),
    ),
  );

  private readonly draftResult = computed(() =>
    applyFilters(
      this.data(),
      this.searchableColumns(),
      this.toggleGroups(),
      this.draftFilters.text(),
      this.draftFilters.toggles(),
    ),
  );

  readonly filteredRows = computed(() => this.filterResult().rows);
  readonly toggleFacets = computed(() => this.filterResult().facets);
  readonly draftFacets = computed(() => this.draftResult().facets);

  readonly emptyText = computed(() => {
    if (this.filters.isActive() && this.data().length > 0) {
      return 'No rows match the current filters.';
    }

    return this.emptyMessage();
  });

  readonly canClearFromEmptyState = computed(
    () => this.filters.isActive() && !this.useFiltersDialog(),
  );

  readonly cellTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<GenericTableCellContext<T>>>();

    for (const directive of this.cellDirectives()) {
      templates.set(directive.columnKey(), directive.templateRef);
    }

    return templates;
  });

  readonly gridTemplateColumns = computed(() => {
    const columns = this.displayedColumns();
    const tracks = columns.map((column) => columnTrack(column));

    if (tracks.length > 0 && !columns.some((column) => isFlexibleColumn(column))) {
      tracks[tracks.length - 1] = `minmax(${columnFloor(columns[columns.length - 1])}, 1fr)`;
    }

    if (this.hasRowActions()) {
      tracks.push('var(--gtt-actions-width)');
    }

    return tracks.length > 0 ? tracks.join(' ') : 'minmax(0, 1fr)';
  });

  private readonly tanstackColumns = computed((): TanstackColumnDef<T, unknown>[] =>
    this.displayedColumns().map((column) => ({
      id: column.key,
      accessorFn: (row) => resolveSortValue(column, row),
      header: column.header,
      enableSorting: column.sortable === true,
    })),
  );

  private readonly paginationState = computed(
    (): PaginationState => ({
      pageIndex: this.isServerPagination() ? 0 : this.clientPageIndex(),
      pageSize: this.activePageSize(),
    }),
  );

  private readonly table = createAngularTable(() => ({
    data: this.filteredRows() as T[],
    columns: this.tanstackColumns(),
    state: {
      sorting: this.sorting(),
      pagination: this.paginationState(),
    },
    manualSorting: this.serverSide(),
    manualPagination: !this.isClientPagination(),
    pageCount: this.isServerPagination()
      ? Math.max(1, Math.ceil(this.totalCount() / this.activePageSize()))
      : undefined,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(this.sorting()) : updater;
      this.sorting.set(next);
      this.sortChange.emit(
        next.length === 0
          ? { active: '', direction: '' }
          : { active: next[0].id, direction: next[0].desc ? 'desc' : 'asc' },
      );
    },
    getCoreRowModel: this.coreRowModel,
    getSortedRowModel: this.sortedRowModel,
    getPaginationRowModel: this.isClientPagination() ? this.paginationRowModel : undefined,
  }));

  readonly sortedRows = computed(() => this.table.getSortedRowModel().rows);

  readonly bodyRows = computed((): Row<T>[] =>
    this.virtualized() ? this.sortedRows() : this.table.getRowModel().rows,
  );

  readonly virtualizer = injectVirtualizer(() => ({
    scrollElement: this.scrollElement(),
    count: this.virtualized() ? this.sortedRows().length : 0,
    estimateSize: () => this.rowHeight(),
    overscan: this.overscan(),
  }));

  readonly renderRows = computed((): RenderRow<T>[] => {
    if (!this.virtualized()) {
      return this.bodyRows().map((model, index) => ({
        row: model.original,
        index,
        offset: null,
        height: null,
      }));
    }

    const rows = this.sortedRows();
    const items: RenderRow<T>[] = [];

    for (const item of this.virtualizer.getVirtualItems()) {
      const model = rows[item.index];

      if (model) {
        items.push({
          row: model.original,
          index: item.index,
          offset: item.start,
          height: item.size,
        });
      }
    }

    return items;
  });

  readonly virtualTotalHeight = computed(() =>
    this.virtualized() ? this.virtualizer.getTotalSize() : null,
  );

  /** Keeps a short last page the same height as a full one so the paginator never jumps. */
  readonly reservedBodyHeight = computed(() => {
    if (!this.showPaginator() || this.renderRows().length === 0) {
      return null;
    }

    return this.activePageSize() * this.rowHeight();
  });

  readonly paginatorLength = computed(() =>
    this.isServerPagination() ? this.totalCount() : this.filteredRows().length,
  );

  readonly paginatorPageIndex = computed(() =>
    this.isServerPagination() ? this.pageIndex() : this.clientPageIndex(),
  );

  readonly ariaRowCount = computed(() => this.renderRows().length + 1);

  readonly ariaColCount = computed(
    () => this.displayedColumns().length + (this.hasRowActions() ? 1 : 0),
  );

  constructor() {
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0;

        if (width > 0) {
          this.hostWidth.set(width);
        }
      });

      observer.observe(this.hostEl.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    }

    this.destroyRef.onDestroy(() => {
      if (this.scrollIdleTimer != null) {
        clearTimeout(this.scrollIdleTimer);
      }
    });

    effect(() => {
      const textKeys = new Set(this.searchableColumns().map((column) => column.key));
      const toggleKeys = new Set(this.toggleGroups().map((group) => group.key));

      untracked(() => {
        this.filters.prune(textKeys, toggleKeys);
        this.draftFilters.prune(textKeys, toggleKeys);
      });
    });

    effect(() => {
      const text = this.filters.text();
      const toggles = this.filters.toggles();

      untracked(() => {
        this.clientPageIndex.set(0);

        if (!this.hasEmittedFilters) {
          this.hasEmittedFilters = true;
          return;
        }

        this.filtersChange.emit({
          text,
          toggles: Object.fromEntries(
            Object.entries(toggles).map(([key, values]) => [key, [...values]]),
          ),
        });
      });
    });

    effect(() => {
      if (!this.isClientPagination()) {
        return;
      }

      const lastPage =
        Math.max(1, Math.ceil(this.filteredRows().length / this.activePageSize())) - 1;

      untracked(() => {
        if (this.clientPageIndex() > lastPage) {
          this.clientPageIndex.set(lastPage);
        }
      });
    });

    effect(() => {
      if (!this.useFiltersDialog()) {
        untracked(() => this.closeFiltersDialog());
      }
    });
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

  cellComponentInputs(column: ColumnDef<T>, row: T): GenericTableCellComponentInputs<T> {
    const value = resolveCellRawValue(column, row);

    if (typeof row !== 'object' || row === null) {
      return { value, row, column };
    }

    let byColumn = this.cellInputsCache.get(row);

    if (!byColumn) {
      byColumn = new Map();
      this.cellInputsCache.set(row, byColumn);
    }

    const cached = byColumn.get(column.key);

    if (cached) {
      cached.value = value;
      cached.column = column;
      return cached;
    }

    const inputs: GenericTableCellComponentInputs<T> = { value, row, column };
    byColumn.set(column.key, inputs);
    return inputs;
  }

  columnAriaSort(column: ColumnDef<T>): 'ascending' | 'descending' | 'none' | null {
    if (column.sortable !== true) {
      return null;
    }

    const entry = this.sorting().find((item) => item.id === column.key);

    if (!entry) {
      return 'none';
    }

    return entry.desc ? 'descending' : 'ascending';
  }

  sortDirection(columnKey: string): false | 'asc' | 'desc' {
    const entry = this.sorting().find((item) => item.id === columnKey);

    if (!entry) {
      return false;
    }

    return entry.desc ? 'desc' : 'asc';
  }

  toggleSort(column: ColumnDef<T>): void {
    if (this.disabled() || column.sortable !== true) {
      return;
    }

    const existing = this.sorting().find((entry) => entry.id === column.key);

    if (!existing) {
      this.table.setSorting([{ id: column.key, desc: false }]);
      return;
    }

    this.table.setSorting(existing.desc ? [] : [{ id: column.key, desc: true }]);
  }

  onColumnVisibility(change: { key: string; visible: boolean }): void {
    if (this.disabled()) {
      return;
    }

    this.visibleKeys.update((keys) => {
      const next = new Set(keys);

      if (change.visible) {
        next.add(change.key);
      } else {
        next.delete(change.key);
      }

      return next;
    });
  }

  showAllColumns(): void {
    this.visibleKeys.set(new Set(this.columns().map((column) => column.key)));
  }

  onChipsChange(event: MatChipListboxChange): void {
    if (this.disabled() || !Array.isArray(event.value)) {
      return;
    }

    const selected = event.value as string[];

    // Guard the chip list the same way the menu does: an empty grid has no layout.
    if (selected.length === 0) {
      return;
    }

    this.visibleKeys.set(new Set(selected));
  }

  onFiltersButtonClick(): void {
    if (this.disabled()) {
      return;
    }

    if (this.useFiltersDialog()) {
      this.openFiltersDialog();
      return;
    }

    this.filtersCollapsed.update((collapsed) => !collapsed);
  }

  openFiltersDialog(): void {
    this.draftFilters.copyFrom(this.filters);
    this.filtersDialogOpen.set(true);

    const dialog = this.filtersDialog()?.nativeElement;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  closeFiltersDialog(): void {
    this.filtersDialogOpen.set(false);

    const dialog = this.filtersDialog()?.nativeElement;

    if (dialog?.open) {
      dialog.close();
    }
  }

  applyDraftFilters(): void {
    if (this.disabled()) {
      return;
    }

    this.filters.copyFrom(this.draftFilters);
    this.closeFiltersDialog();
  }

  clearFilters(): void {
    if (!this.disabled()) {
      this.filters.clear();
    }
  }

  clearDraftFilters(): void {
    if (!this.disabled()) {
      this.draftFilters.clear();
    }
  }

  onPageChange(event: GenericTablePageEvent): void {
    if (this.disabled()) {
      return;
    }

    this.activePageSize.set(event.pageSize);

    if (!this.isServerPagination()) {
      this.clientPageIndex.set(event.pageIndex);
    }

    this.pageChange.emit(event);
  }

  onRowClick(row: T): void {
    if (!this.disabled() && this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }

  onRowKeydown(event: KeyboardEvent, row: T): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(row);
  }

  rowMenuItems(row: T): ContextMenuItem[] {
    return this.rowMenu(row).items;
  }

  rowMenuDetails(row: T): ContextMenuDetailField[] {
    return this.rowMenu(row).details;
  }

  rowMenuTitle(row: T): string | null {
    return this.rowMenu(row).title;
  }

  onRowMenuSelect(item: ContextMenuItem, row: T): void {
    if (!this.disabled()) {
      this.rowAction.emit({ actionId: item.id, row });
    }
  }

  onExportClick(): void {
    if (this.disabled()) {
      return;
    }

    const fileName = withCsvExtension(this.exportFileName());
    const complete = (rows: readonly T[]) => this.downloadCsv(rows, fileName);

    this.exportRequest.emit({ fileName, complete });

    if (!this.isServerPagination() || this.exportData() != null) {
      complete(this.exportData() ?? this.filteredRows());
    }
  }

  onScroll(): void {
    this.isScrolling.set(true);

    if (this.scrollIdleTimer != null) {
      clearTimeout(this.scrollIdleTimer);
    }

    this.scrollIdleTimer = setTimeout(() => {
      this.isScrolling.set(false);
      this.scrollIdleTimer = null;
    }, SCROLL_IDLE_MS);
  }

  trackRenderRow = (_index: number, item: RenderRow<T>): unknown =>
    this.trackBy()(item.index, item.row);

  private rowMenu(row: T): RowMenuEntry {
    const source = this.rowActions();

    if (typeof row !== 'object' || row === null) {
      return this.buildRowMenu(row, source);
    }

    const cached = this.rowMenuCache.get(row);

    if (cached && cached.source === source) {
      return cached;
    }

    const entry = this.buildRowMenu(row, source);
    this.rowMenuCache.set(row, entry);
    return entry;
  }

  private buildRowMenu(row: T, source: readonly GenericTableRowAction<T>[]): RowMenuEntry {
    const title = this.rowDetailsTitle();

    return {
      source,
      items: source
        .filter((action) => !resolveRowFlag(action.hidden, row))
        .map((action) => ({
          id: action.id,
          label: action.label,
          icon: action.icon,
          danger: action.danger,
          dividerBefore: action.dividerBefore,
          disabled: resolveRowFlag(action.disabled, row),
        })),
      details: this.rowDetails()?.(row) ?? [],
      title: typeof title === 'function' ? title(row) : title,
    };
  }

  private downloadCsv(rows: readonly T[], fileName: string): void {
    const columns = this.displayedColumns();
    const lines = [
      columns.map((column) => escapeCsvField(column.header)).join(','),
      ...rows.map((row) =>
        columns.map((column) => escapeCsvField(exportValue(column, row))).join(','),
      ),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

function isFlexibleColumn<T>(column: ColumnDef<T>): boolean {
  return !column.width?.trim();
}

function columnFloor<T>(column: ColumnDef<T>): string {
  return column.minWidth?.trim() || column.width?.trim() || 'var(--gtt-column-min-width)';
}

function columnTrack<T>(column: ColumnDef<T>): string {
  const width = column.width?.trim();
  const minWidth = column.minWidth?.trim();

  if (width && minWidth) {
    return `minmax(${minWidth}, ${width})`;
  }

  if (width) {
    return width;
  }

  if (minWidth) {
    return `minmax(${minWidth}, 1fr)`;
  }

  return 'minmax(var(--gtt-column-min-width), 1fr)';
}

function resolveRowFlag<T>(
  value: boolean | ((row: T) => boolean) | undefined,
  row: T,
): boolean {
  return typeof value === 'function' ? value(row) : value === true;
}

function withCsvExtension(fileName: string): string {
  return fileName.toLowerCase().endsWith('.csv') ? fileName : `${fileName}.csv`;
}

function exportValue<T>(column: ColumnDef<T>, row: T): string {
  const value = resolveCellRawValue(column, row);

  if (value == null) {
    return '';
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }

  return String(value);
}

function escapeCsvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
