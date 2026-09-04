import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
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
import { FormsModule } from '@angular/forms';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { LucideDynamicIcon, LucideFunnel, LucidePanelLeftClose } from '@lucide/angular';
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
import { CustomInputComponent } from '../custom-input/custom-input';
import { GenericTableCellDirective } from './generic-table-cell.directive';
import {
  collectToggleGroupOptions,
  columnMatchesFilter,
  isColumnToggleable,
  resolveCellRawValue,
  resolveSortValue,
  resolveToggleGroups,
  rowMatchesToggleGroup,
  sortToggleOptions,
  toggleSelectionKey,
  type GenericTableToggleFacet,
} from './generic-table-cell-format';
import { GenericTableCellValueComponent } from './generic-table-cell-value.component';
import { GenericTableHeaderInfoComponent } from './generic-table-header-info.component';
import {
  ColumnDef,
  GENERIC_TABLE_ROW_ACTIONS_TRACK,
  GenericTableCellContext,
  GenericTableExportRequest,
  GenericTableHeightMode,
  GenericTableRowAction,
  GenericTableRowActionEvent,
} from './generic-table.types';

const DEFAULT_MAX_HEIGHT_PX = 480;

@Component({
  selector: 'app-generic-table-tanstack',
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
    FormsModule,
    MatChipsModule,
    MatPaginatorModule,
    LucideDynamicIcon,
    ContextMenuComponent,
    CustomInputComponent,
    GenericTableHeaderInfoComponent,
    GenericTableCellValueComponent,
  ],
  templateUrl: './generic-table-tanstack.component.html',
  styleUrl: './generic-table-tanstack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'generic-table-tanstack-host',
    '[class.generic-table-tanstack-host--fill]': 'isFillMode()',
    '[class.generic-table-tanstack-host--parent]': 'isParentMode()',
    '[class.generic-table-tanstack-host--bounded]': 'isBoundedHeightMode()',
    '[class.generic-table-tanstack-host--virtualized]': 'virtualized()',
    '[class.generic-table-tanstack-host--disabled]': 'disabled()',
    '[style.--gtt-bounded-max-height.px]': 'boundedMaxHeightPx()',
    '[style.--gtt-parent-min-height]': 'parentMinHeight()',
  },
})
export class GenericTableTanstackComponent<T = unknown> {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private scrollEndTimer: ReturnType<typeof setTimeout> | null = null;
  private layoutSyncFrame: number | null = null;
  private boundedResizeObserver: ResizeObserver | null = null;
  private observedBoundedTargets = new Set<HTMLElement>();

  readonly isScrolling = signal(false);
  readonly LucideFunnel = LucideFunnel;
  readonly LucidePanelLeftClose = LucidePanelLeftClose;

  readonly columns = input.required<ColumnDef<T>[]>();
  readonly data = input.required<readonly T[]>();

  readonly paginated = input(false);

  readonly serverSide = input(false);
  readonly totalCount = input(0);
  readonly pageIndex = input(0);

  readonly virtualized = input(false);
  readonly rowHeight = input(40);

  readonly overscan = input(12);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);

  readonly showColumnToggle = input(true);
  readonly emptyMessage = input('No data available');
  readonly rowClickable = input(false);

  readonly rowMenuVariant = input<ContextMenuVariant>('actions');

  readonly rowActions = input<GenericTableRowAction<T>[]>([]);

  readonly rowDetails = input<((row: T) => ContextMenuDetailField[]) | null>(null);

  readonly rowDetailsTitle = input<string | ((row: T) => string) | null>(null);
  readonly disabled = input(false);
  readonly showExport = input(false);
  readonly exportFileName = input('table-export.csv');
  readonly exportData = input<readonly T[] | null>(null);
  readonly heightMode = input<GenericTableHeightMode>('auto');

  readonly height = input<string | null>(null);

  readonly maxHeight = input<string | null>(null);
  readonly minHeight = input<string | null>(null);

  readonly filterMinHeight = input<string | null>(null);
  readonly trackBy = input<TrackByFunction<T>>((_index, row) => row);

  readonly rowClick = output<T>();

  readonly rowAction = output<GenericTableRowActionEvent<T>>();

  readonly sortChange = output<Sort>();
  readonly pageChange = output<PageEvent>();
  readonly exportRequest = output<GenericTableExportRequest<T>>();

  private readonly scrollElement = viewChild<ElementRef<HTMLDivElement>>('scrollElement');
  private readonly headerTrack = viewChild<ElementRef<HTMLElement>>('headerTrack');
  private readonly virtualShell = viewChild<ElementRef<HTMLElement>>('virtualShell');
  private readonly cellDirectives = contentChildren(GenericTableCellDirective);
  private readonly cellContextCache = new WeakMap<object, GenericTableCellContext<T>>();

  readonly sorting = signal<SortingState>([]);

  readonly clientPagination = signal<PaginationState>({ pageIndex: 0, pageSize: 10 });

  readonly isParentMode = computed(() => this.heightMode() === 'parent');
  readonly isFixed = computed(() => !this.isParentMode() && this.height() != null);
  readonly isFillMode = computed(() => !this.isFixed() && this.heightMode() === 'fill');
  readonly isBoundedHeightMode = computed(() => this.isParentMode() || this.isFillMode());
  readonly scrollBodyHeight = computed(() => (this.isParentMode() ? null : this.height()));

  readonly parentMinHeight = computed(() => (this.isParentMode() ? this.height() : null));
  readonly showPaginator = computed(() => this.paginated() && !this.virtualized());
  readonly isServerSidePagination = computed(() => this.serverSide() && this.showPaginator());

  readonly headerHeightPx = signal(40);
  readonly boundedAvailableHeightPx = signal<number | null>(null);
  readonly boundedChromeHeightPx = signal(0);
  readonly scrollbarGutterPx = signal(0);

  readonly boundedMaxHeightPx = computed(() => {
    if (!this.isBoundedHeightMode()) {
      return null;
    }

    if (this.isParentMode()) {
      return this.resolveExplicitMaxHeightPx();
    }

    const available = this.boundedAvailableHeightPx();

    if (available == null) {
      return this.virtualized() ? null : this.resolveBoundedAvailableFallbackPx();
    }

    if (this.virtualized()) {
      return available;
    }

    const maxBodyCap = this.resolveExplicitMaxHeightPx();

    if (maxBodyCap == null) {
      return available;
    }

    return Math.min(
      available,
      maxBodyCap + this.boundedChromeHeightPx() + this.headerHeightPx(),
    );
  });

  readonly virtualViewportHeightPx = computed(() => {
    if (!this.virtualized()) {
      return null;
    }

    if (this.isFixed()) {
      return null;
    }

    const rowCount = Math.max(this.sortedRows().length, 1);
    const bodyContent = rowCount * this.rowHeight();

    if (this.isBoundedHeightMode()) {
      const available = this.boundedAvailableHeightPx();

      if (available == null) {

        return null;
      }

      const fillHeight = Math.max(
        0,
        available - this.boundedChromeHeightPx() - this.headerHeightPx(),
      );

      if (fillHeight < this.rowHeight()) {
        return null;
      }

      return this.resolveBoundedScrollBodyHeightPx(bodyContent, fillHeight);
    }

    const maxBody = Math.max(
      this.rowHeight(),
      this.resolveMaxScrollHeightPx() - this.headerHeightPx(),
    );

    return Math.min(bodyContent, maxBody);
  });

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
    this.columns().filter(
      (column) => column.hideable === false || this.visibleKeys().has(column.key),
    ),
  );

  readonly searchableColumns = computed(() =>
    this.columns().filter((column) => column.searchable === true),
  );

  readonly toggleableColumns = computed(() =>
    this.columns().filter((column) => isColumnToggleable(column)),
  );

  readonly filterColumns = computed(() =>
    this.columns().filter(
      (column) => column.searchable === true || isColumnToggleable(column),
    ),
  );

  readonly hasFilterColumns = computed(() => this.filterColumns().length > 0);

  readonly hasIndependentFilterHeight = computed(
    () => this.hasFilterColumns() && this.filterMinHeight() != null,
  );

  readonly columnFilterValues = signal<Readonly<Record<string, string>>>({});

  readonly columnToggleSelections = signal<Readonly<Record<string, ReadonlySet<string>>>>(
    {},
  );

  readonly filtersCollapsed = signal(false);

  readonly toggleFacets = computed((): GenericTableToggleFacet<T>[] => {
    const rows = this.data();
    const textValues = this.columnFilterValues();
    const toggleValues = this.columnToggleSelections();
    const searchable = this.searchableColumns();
    const facets: GenericTableToggleFacet<T>[] = [];

    const activeText = searchable.filter(
      (column) => (textValues[column.key] ?? '').trim().length > 0,
    );

    const textFilteredRows = rows.filter((row) =>
      activeText.every((textColumn) =>
        columnMatchesFilter(
          textColumn,
          row,
          textValues[textColumn.key] ?? '',
        ),
      ),
    );

    for (const column of this.toggleableColumns()) {
      for (const group of resolveToggleGroups(column)) {
        const selfKey = toggleSelectionKey(column.key, group.id);

        const baseRows = textFilteredRows.filter((row) =>
          this.toggleableColumns().every((toggleColumn) =>
            resolveToggleGroups(toggleColumn).every((otherGroup) => {
              const otherKey = toggleSelectionKey(toggleColumn.key, otherGroup.id);

              // Ignore current group's selection when computing its siblings' counts.
              if (otherKey === selfKey) {
                return true;
              }

              return rowMatchesToggleGroup(otherGroup, row, toggleValues[otherKey]);
            }),
          ),
        );

        const counted = collectToggleGroupOptions(group, baseRows);
        const countByValue = new Map(counted.map((option) => [option.value, option.count]));
        const universe = collectToggleGroupOptions(group, textFilteredRows);
        const values = new Set(universe.map((option) => option.value));
        const selected = toggleValues[selfKey];

        if (selected?.size) {
          for (const value of selected) {
            values.add(value);
          }
        }

        facets.push({
          columnKey: column.key,
          group,
          label: group.label ?? column.header,
          options: sortToggleOptions(
            [...values].map((value) => ({
              value,
              count: countByValue.get(value) ?? 0,
            })),
          ),
        });
      }
    }

    return facets;
  });

  toggleFacetsForColumn(columnKey: string): GenericTableToggleFacet<T>[] {
    return this.toggleFacets().filter((facet) => facet.columnKey === columnKey);
  }

  readonly hasActiveFilters = computed(() => {
    const textValues = this.columnFilterValues();
    const hasText = this.searchableColumns().some(
      (column) => (textValues[column.key] ?? '').trim().length > 0,
    );

    if (hasText) {
      return true;
    }

    const toggles = this.columnToggleSelections();
    return Object.values(toggles).some((selected) => (selected?.size ?? 0) > 0);
  });

  readonly filteredRows = computed((): T[] => {
    const rows = this.data();
    const textValues = this.columnFilterValues();
    const toggleValues = this.columnToggleSelections();

    const activeText = this.searchableColumns().filter(
      (column) => (textValues[column.key] ?? '').trim().length > 0,
    );

    const activeToggleGroups = this.toggleableColumns().flatMap((column) =>
      resolveToggleGroups(column)
        .map((group) => ({
          columnKey: column.key,
          group,
          key: toggleSelectionKey(column.key, group.id),
        }))
        .filter((entry) => (toggleValues[entry.key]?.size ?? 0) > 0),
    );

    if (activeText.length === 0 && activeToggleGroups.length === 0) {
      return [...rows];
    }

    return rows.filter(
      (row) =>
        activeText.every((column) =>
          columnMatchesFilter(column, row, textValues[column.key] ?? ''),
        ) &&
        activeToggleGroups.every((entry) =>
          rowMatchesToggleGroup(entry.group, row, toggleValues[entry.key]),
        ),
    );
  });

  readonly tableEmptyMessage = computed(() => {
    if (this.hasActiveFilters() && this.data().length > 0 && this.filteredRows().length === 0) {
      return 'No rows match the current filters.';
    }

    return this.emptyMessage();
  });

  readonly hasRowActions = computed(
    () =>
      (this.rowMenuVariant() === 'actions' && this.rowActions().length > 0) ||
      (this.rowMenuVariant() === 'details' && this.rowDetails() != null),
  );

  readonly gridTemplateColumns = computed(() => {
    const columns = this.displayedColumns();

    if (columns.length === 0 && !this.hasRowActions()) {
      return '';
    }

    const tracks = columns.map((column, index) =>
      this.resolveColumnTrack(column, { stretch: index === columns.length - 1 }),
    );

    if (this.hasRowActions()) {
      tracks.push(GENERIC_TABLE_ROW_ACTIONS_TRACK);
    }

    return tracks.join(' ');
  });

  readonly gridMinWidthPx = computed(() => {
    const reference =
      this.scrollContentWidthPx() || this.hostEl.nativeElement.clientWidth || globalThis.innerWidth;
    let total = 0;

    for (const column of this.displayedColumns()) {
      total += this.columnFloorPx(column, reference);
    }

    if (this.hasRowActions()) {
      total += this.parseLengthToPx(GENERIC_TABLE_ROW_ACTIONS_TRACK, reference);
    }

    return Math.ceil(total);
  });

  readonly gridLayoutWidthPx = computed((): number | null => {
    const min = this.gridMinWidthPx();
    const viewport = this.scrollContentWidthPx();

    if (viewport > 0 && min > viewport + 1) {
      return min;
    }

    return null;
  });

  readonly scrollContentWidthPx = signal(0);

  private readonly tanstackColumns = computed((): TanstackColumnDef<T, unknown>[] =>
    this.displayedColumns().map((column) => ({
      id: column.key,
      accessorFn: (row) => this.sortValue(column, row),
      header: column.header,
      enableSorting: column.sortable === true,
    })),
  );

  private readonly paginationState = computed((): PaginationState => {
    if (this.isServerSidePagination()) {

      return { pageIndex: 0, pageSize: this.pageSize() };
    }

    const client = this.clientPagination();
    return {
      pageIndex: client.pageIndex,
      pageSize: this.pageSize() || client.pageSize,
    };
  });

  private readonly tableData = signal<T[]>([]);
  private readonly tableColumnDefs = signal<TanstackColumnDef<T, unknown>[]>([]);

  private readonly table = createAngularTable(() => {
    const paginateClientSide = this.showPaginator() && !this.isServerSidePagination();

    return {
      data: this.tableData(),
      columns: this.tableColumnDefs(),
      state: {
        sorting: this.sorting(),
        pagination: this.paginationState(),
      },
      manualPagination: this.isServerSidePagination() || this.virtualized() || !this.showPaginator(),
      pageCount: this.isServerSidePagination()
        ? Math.max(1, Math.ceil(this.totalCount() / Math.max(this.pageSize(), 1)))
        : undefined,
      onSortingChange: (updater) => {
        const next = typeof updater === 'function' ? updater(this.sorting()) : updater;
        this.sorting.set(next);
        this.emitMaterialSort(next);
      },
      onPaginationChange: (updater) => {
        if (this.isServerSidePagination() || this.virtualized()) {
          return;
        }

        const next =
          typeof updater === 'function' ? updater(this.paginationState()) : updater;
        this.clientPagination.set(next);
      },
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: paginateClientSide ? getPaginationRowModel() : undefined,
    };
  });

  readonly sortedRows = computed(() => this.table.getSortedRowModel().rows);

  readonly bodyRows = computed((): Row<T>[] => {
    if (this.virtualized()) {
      return this.sortedRows();
    }

    return this.table.getRowModel().rows;
  });

  readonly paginatedBodyMinHeightPx = computed(() => {
    if (!this.showPaginator() || this.bodyRows().length === 0) {
      return null;
    }

    return this.pageSize() * this.rowHeight();
  });

  readonly virtualizer = injectVirtualizer(() => ({
    scrollElement: this.scrollElement(),
    count: this.virtualized() ? this.sortedRows().length : 0,
    estimateSize: () => this.rowHeight(),
    overscan: this.overscan(),
  }));

  readonly paginatorLength = computed(() =>
    this.isServerSidePagination() ? this.totalCount() : this.filteredRows().length,
  );

  readonly paginatorPageIndex = computed(() =>
    this.isServerSidePagination()
      ? this.pageIndex()
      : this.clientPagination().pageIndex,
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.scrollEndTimer != null) {
        clearTimeout(this.scrollEndTimer);
      }

      if (this.layoutSyncFrame != null) {
        cancelAnimationFrame(this.layoutSyncFrame);
      }

      this.boundedResizeObserver?.disconnect();
    });

    this.boundedResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.scrollElement()?.nativeElement) {
          this.scrollContentWidthPx.set(entry.contentRect.width);
        }
      }

      this.measureBoundedLayout();
    });

    effect(() => {
      this.tableData.set(this.filteredRows());
      this.tableColumnDefs.set(this.tanstackColumns());
    });

    effect(() => {
      this.columnFilterValues();
      this.columnToggleSelections();

      untracked(() => {
        const current = this.clientPagination();

        if (current.pageIndex !== 0) {
          this.clientPagination.set({ ...current, pageIndex: 0 });
        }
      });
    });

    effect(() => {
      const size = this.pageSize();
      const current = this.clientPagination();

      if (current.pageSize !== size) {
        this.clientPagination.set({ ...current, pageSize: size, pageIndex: 0 });
      }
    });

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
      this.hasFilterColumns();
      this.data();
      this.virtualized();

      const host = this.hostEl.nativeElement;
      const parent = host.parentElement;
      const targets = new Set<HTMLElement>();

      if (parent) {
        targets.add(parent);
      }

      if (this.isFillMode()) {
        targets.add(host);
      }

      const viewportEl = this.scrollElement()?.nativeElement;

      if (viewportEl) {
        targets.add(viewportEl);
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
      this.displayedColumns();
      this.data();
      this.virtualized();
      this.virtualShell();
      this.headerTrack();
      this.scrollElement();
      this.gridMinWidthPx();

      untracked(() => this.queueLayoutSync());
    });

    effect(() => {
      const viewportEl = this.scrollElement()?.nativeElement;

      if (!viewportEl || this.isBoundedHeightMode()) {
        return;
      }

      this.boundedResizeObserver?.observe(viewportEl);
      this.observedBoundedTargets.add(viewportEl);

      untracked(() => {
        this.scrollContentWidthPx.set(viewportEl.clientWidth);
      });
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

  cellComponentInputs(column: ColumnDef<T>, row: T): Record<string, unknown> {
    return {
      value: resolveCellRawValue(column, row),
      row,
      column,
    };
  }

  isColumnVisible(key: string): boolean {
    return this.visibleKeys().has(key);
  }

  onColumnFilterValue(key: string, value: string): void {
    if (this.disabled()) {
      return;
    }

    this.columnFilterValues.update((current) => {
      if (!value) {
        if (!(key in current)) {
          return current;
        }

        const next = { ...current };
        delete next[key];
        return next;
      }

      if (current[key] === value) {
        return current;
      }

      return { ...current, [key]: value };
    });
  }

  clearAllFilters(): void {
    if (this.disabled() || !this.hasActiveFilters()) {
      return;
    }

    this.columnFilterValues.set({});
    this.columnToggleSelections.set({});
  }

  toggleFiltersCollapsed(): void {
    if (this.disabled()) {
      return;
    }

    this.filtersCollapsed.update((collapsed) => !collapsed);
  }

  columnFilterDisplayValue(key: string): string {
    return this.columnFilterValues()[key] ?? '';
  }

  isToggleValueSelected(columnKey: string, groupId: string, value: string): boolean {
    return (
      this.columnToggleSelections()[toggleSelectionKey(columnKey, groupId)]?.has(value) ===
      true
    );
  }

  onToggleFilterInput(
    columnKey: string,
    groupId: string,
    value: string,
    event: Event,
  ): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.onToggleFilterChange(columnKey, groupId, value, checked);
  }

  onToggleFilterChange(
    columnKey: string,
    groupId: string,
    value: string,
    checked: boolean,
  ): void {
    if (this.disabled()) {
      return;
    }

    const selectionKey = toggleSelectionKey(columnKey, groupId);

    this.columnToggleSelections.update((current) => {
      const existing = current[selectionKey] ?? new Set<string>();
      const nextSet = new Set(existing);

      if (checked) {
        nextSet.add(value);
      } else {
        nextSet.delete(value);
      }

      if (nextSet.size === 0) {
        if (!(selectionKey in current)) {
          return current;
        }

        const next = { ...current };
        delete next[selectionKey];
        return next;
      }

      return { ...current, [selectionKey]: nextSet };
    });
  }

  toggleFilterName(value: string): string {
    return value === '' ? '(Empty)' : value;
  }

  toggleOptionId(columnKey: string, groupId: string, value: string): string {
    const safe =
      value === '' ? '__empty' : encodeURIComponent(value).replaceAll('%', '_');
    return `gtt-toggle-${columnKey}-${groupId}-${safe}`;
  }

  onToggleColumns(event: MatChipListboxChange): void {
    if (this.disabled()) {
      return;
    }

    if (Array.isArray(event.value)) {
      this.visibleKeys.set(new Set(event.value));
    }
  }

  toggleSort(column: ColumnDef<T>): void {
    if (this.disabled() || !column.sortable) {
      return;
    }

    const current = this.sorting();
    const existing = current.find((entry) => entry.id === column.key);

    if (!existing) {
      this.table.setSorting([{ id: column.key, desc: false }]);
      return;
    }

    if (!existing.desc) {
      this.table.setSorting([{ id: column.key, desc: true }]);
      return;
    }

    this.table.setSorting([]);
  }

  sortDirection(columnKey: string): false | 'asc' | 'desc' {
    const entry = this.sorting().find((item) => item.id === columnKey);

    if (!entry) {
      return false;
    }

    return entry.desc ? 'desc' : 'asc';
  }

  onPageChange(event: PageEvent): void {
    if (this.disabled()) {
      return;
    }

    if (!this.isServerSidePagination()) {
      this.clientPagination.set({
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      });
    }

    this.pageChange.emit(event);
  }

  onRowClick(row: T): void {
    if (this.disabled() || !this.rowClickable()) {
      return;
    }

    this.rowClick.emit(row);
  }

  rowMenuItems(row: T): ContextMenuItem[] {
    return this.rowActions()
      .filter((action) => !this.resolveRowActionFlag(action.hidden, row))
      .map((action) => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        danger: action.danger,
        dividerBefore: action.dividerBefore,
        disabled: this.resolveRowActionFlag(action.disabled, row),
      }));
  }

  rowMenuDetails(row: T): ContextMenuDetailField[] {
    return this.rowDetails()?.(row) ?? [];
  }

  rowMenuDetailsTitle(row: T): string | null {
    const title = this.rowDetailsTitle();

    if (title == null) {
      return null;
    }

    return typeof title === 'function' ? title(row) : title;
  }

  onRowMenuSelect(item: ContextMenuItem, row: T): void {
    if (this.disabled()) {
      return;
    }

    this.rowAction.emit({ actionId: item.id, row });
  }

  private resolveRowActionFlag(
    value: boolean | ((row: T) => boolean) | undefined,
    row: T,
  ): boolean {
    if (typeof value === 'function') {
      return value(row);
    }

    return value === true;
  }

  exportToCsv(fileName = this.exportFileName(), rows?: readonly T[]): void {
    if (this.disabled()) {
      return;
    }

    this.downloadCsv(rows ?? this.exportData() ?? this.filteredRows(), fileName);
  }

  onExportClick(): void {
    this.requestCsvExport();
  }

  requestCsvExport(fileName = this.exportFileName()): void {
    if (this.disabled()) {
      return;
    }

    const resolvedName = this.resolveCsvFileName(fileName);
    const complete = (rows: readonly T[]) => this.downloadCsv(rows, resolvedName);

    this.exportRequest.emit({ fileName: resolvedName, complete });

    if (!this.isServerSidePagination() || this.exportData() != null) {
      complete(this.exportData() ?? this.filteredRows());
    }
  }

  onScroll(event?: Event): void {
    this.isScrolling.set(true);

    if (this.scrollEndTimer != null) {
      clearTimeout(this.scrollEndTimer);
    }

    this.scrollEndTimer = setTimeout(() => {
      this.isScrolling.set(false);
      this.scrollEndTimer = null;
    }, 150);

    if (!event) {
      return;
    }

    const viewport = event.currentTarget as HTMLElement;
    const header = this.headerTrack()?.nativeElement;

    if (header && header.scrollLeft !== viewport.scrollLeft) {
      header.scrollLeft = viewport.scrollLeft;
    }

    const gutter = viewport.offsetWidth - viewport.clientWidth;

    if (gutter !== this.scrollbarGutterPx()) {
      this.scrollbarGutterPx.set(gutter);
    }

    if (viewport.clientWidth !== this.scrollContentWidthPx()) {
      this.scrollContentWidthPx.set(viewport.clientWidth);
    }

    const headerHeight = header?.offsetHeight ?? 0;

    if (headerHeight > 0 && headerHeight !== this.headerHeightPx()) {
      this.headerHeightPx.set(headerHeight);
    }
  }

  trackVirtualRow(virtualIndex: number): unknown {
    const row = this.sortedRows()[virtualIndex]?.original;

    if (row === undefined) {
      return virtualIndex;
    }

    return this.trackBy()(virtualIndex, row);
  }

  trackBodyRow(index: number, row: Row<T>): unknown {
    return this.trackBy()(index, row.original);
  }

  private emitMaterialSort(state: SortingState): void {
    if (state.length === 0) {
      this.sortChange.emit({ active: '', direction: '' });
      return;
    }

    const [first] = state;
    this.sortChange.emit({
      active: first.id,
      direction: first.desc ? 'desc' : 'asc',
    });
  }

  private sortValue(column: ColumnDef<T>, row: T): string | number {
    return resolveSortValue(column, row);
  }

  private downloadCsv(rows: readonly T[], fileName: string): void {
    const columns = this.columns();
    const lines = [
      columns.map((column) => this.escapeCsvField(column.header)).join(','),
      ...rows.map((row) =>
        columns
          .map((column) => this.escapeCsvField(this.getRawExportValue(row, column.key)))
          .join(','),
      ),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = this.resolveCsvFileName(fileName);
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private resolveCsvFileName(fileName: string): string {
    return fileName.toLowerCase().endsWith('.csv') ? fileName : `${fileName}.csv`;
  }

  private escapeCsvField(value: string | number): string {
    const text = String(value);

    if (/[",\n\r]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
  }

  private getRawExportValue(row: T, key: string): string {
    if (typeof row !== 'object' || row === null || !(key in row)) {
      return '';
    }

    const value = (row as Record<string, unknown>)[key];

    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }

  private resolveColumnTrack(
    column: ColumnDef<T>,
    options: { stretch?: boolean } = {},
  ): string {
    const floor = this.columnFloorLength(column);

    if (options.stretch) {
      return `minmax(${floor}, 1fr)`;
    }

    if (column.width && column.minWidth != null && column.minWidth !== '') {
      return `minmax(${column.minWidth}, ${column.width})`;
    }

    if (column.width) {
      return column.width;
    }

    if (column.minWidth != null && column.minWidth !== '') {
      return column.minWidth;
    }

    return 'minmax(0, 1fr)';
  }

  private columnFloorLength(column: ColumnDef<T>): string {
    if (column.minWidth != null && column.minWidth !== '') {
      return column.minWidth;
    }

    if (column.width) {
      return column.width;
    }

    return '0px';
  }

  private columnFloorPx(column: ColumnDef<T>, referenceWidth: number): number {
    return Math.max(0, this.parseLengthToPx(this.columnFloorLength(column), referenceWidth));
  }

  columnMinWidth(column: ColumnDef<T>): string | null {
    if (column.minWidth != null && column.minWidth !== '') {
      return column.minWidth;
    }

    return column.width ?? null;
  }

  columnMaxWidth(column: ColumnDef<T>, stretch = false): string | null {

    if (stretch) {
      return null;
    }

    return column.width ?? null;
  }

  private resolveMaxScrollHeightPx(): number {
    return this.resolveExplicitMaxHeightPx() ?? DEFAULT_MAX_HEIGHT_PX;
  }

  private resolveExplicitMaxHeightPx(referenceWidth?: number): number | null {
    const maxHeight = this.maxHeight();

    if (!maxHeight) {
      return null;
    }

    const ref = referenceWidth ?? this.hostEl.nativeElement.clientWidth ?? globalThis.innerWidth;
    const parsed = this.parseLengthToPx(maxHeight, ref);

    return parsed > 0 ? parsed : null;
  }

  private resolveMinScrollHeightPx(): number {
    const value = this.minHeight();

    if (!value) {
      return 0;
    }

    const parsed = this.parseLengthToPx(
      value,
      this.hostEl.nativeElement.clientWidth ?? globalThis.innerWidth,
    );

    return parsed > 0 ? parsed : 0;
  }

  private resolveBoundedScrollBodyHeightPx(contentHeight: number, fillHeight: number): number {
    const minHeight = this.resolveMinScrollHeightPx();

    if (this.isParentMode()) {
      return Math.max(fillHeight, minHeight);
    }

    if (fillHeight < minHeight) {
      return Math.max(contentHeight, minHeight);
    }

    return Math.min(contentHeight, fillHeight);
  }

  private resolveHeightInputPx(): number {
    const value = this.height();

    if (!value) {
      return 0;
    }

    const parsed = this.parseLengthToPx(
      value,
      this.hostEl.nativeElement.clientWidth ?? globalThis.innerWidth,
    );

    return parsed > 0 ? parsed : 0;
  }

  private clampParentAvailableHeightPx(measured: number): number {
    const floor = this.resolveHeightInputPx();
    const cap = this.resolveExplicitMaxHeightPx();
    let size = Math.max(measured, floor);

    if (cap != null) {
      size = Math.min(size, Math.max(cap, floor));
    }

    return size;
  }

  private resolveBoundedAvailableFallbackPx(): number {
    const maxBody = this.resolveExplicitMaxHeightPx() ?? DEFAULT_MAX_HEIGHT_PX;
    const chrome = this.boundedChromeHeightPx();
    const header = this.virtualized() ? this.headerHeightPx() : 0;

    return maxBody + chrome + header;
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

    const parsed = Number.parseFloat(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private queueLayoutSync(): void {
    if (this.layoutSyncFrame != null) {
      cancelAnimationFrame(this.layoutSyncFrame);
    }

    this.layoutSyncFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.layoutSyncFrame = null;
        this.syncVirtualLayout();
      });
    });
  }

  private syncVirtualLayout(): void {
    const viewport = this.scrollElement()?.nativeElement;
    const header = this.headerTrack()?.nativeElement;

    if (!viewport || !header) {
      return;
    }

    const headerHeight = header.offsetHeight;

    if (headerHeight > 0) {
      this.headerHeightPx.set(headerHeight);
    }

    this.scrollbarGutterPx.set(viewport.offsetWidth - viewport.clientWidth);
    this.scrollContentWidthPx.set(viewport.clientWidth);
    this.measureBoundedLayout();

    if (this.virtualized()) {

      this.virtualizer.measure();
    }
  }

  private measureBoundedLayout(): void {
    if (!this.isBoundedHeightMode()) {
      return;
    }

    const host = this.hostEl.nativeElement;
    const parent = host.parentElement;

    if (!parent) {
      return;
    }

    const measured = this.isFillMode()
      ? this.measureFillAvailableHeight(host, parent)
      : this.measureParentAvailableHeight(host, parent);

    this.boundedAvailableHeightPx.set(
      this.isParentMode() ? this.clampParentAvailableHeightPx(measured) : measured,
    );

    const tableRoot = host.querySelector('.generic-table-tanstack');

    const scrollBody = this.virtualized()
      ? host.querySelector('.generic-table-tanstack__virtual-shell')
      : host.querySelector('.generic-table-tanstack__static-shell');

    if (tableRoot instanceof HTMLElement && scrollBody instanceof HTMLElement) {
      this.boundedChromeHeightPx.set(
        Math.max(0, tableRoot.clientHeight - scrollBody.clientHeight),
      );
    }

    const header = this.headerTrack()?.nativeElement;
    const headerHeight = header?.offsetHeight ?? 0;

    if (headerHeight > 0 && headerHeight !== this.headerHeightPx()) {
      this.headerHeightPx.set(headerHeight);
    }
  }

  private measureFillAvailableHeight(host: HTMLElement, parent: HTMLElement): number {
    const parentStyle = getComputedStyle(parent);
    const gap = Number.parseFloat(parentStyle.rowGap || parentStyle.gap) || 0;
    let siblingHeight = 0;

    for (const child of parent.children) {
      if (child === host || !(child instanceof HTMLElement)) {
        continue;
      }

      siblingHeight += child.offsetHeight;
    }

    const flexGapTotal = Math.max(0, parent.children.length - 1) * gap;
    return Math.max(0, parent.clientHeight - siblingHeight - flexGapTotal);
  }

  private measureParentAvailableHeight(host: HTMLElement, parent: HTMLElement): number {
    const parentStyle = getComputedStyle(parent);
    const parsedHeight = this.parseLengthToPx(parentStyle.height, parent.clientWidth);
    const parsedMaxHeight = this.parseLengthToPx(parentStyle.maxHeight, parent.clientWidth);
    const hasExplicitHeight = parentStyle.height !== 'auto' && parsedHeight > 0;
    const hasExplicitMaxHeight = parentStyle.maxHeight !== 'none' && parsedMaxHeight > 0;
    const hostHeight = host.offsetHeight;
    const parentHeight = parent.clientHeight;

    if (hasExplicitHeight || hasExplicitMaxHeight) {
      return parentHeight;
    }

    if (hostHeight > 0 && parentHeight - hostHeight <= 2) {
      return hostHeight;
    }

    return parentHeight;
  }
}
