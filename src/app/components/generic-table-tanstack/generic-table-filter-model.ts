import { computed, signal } from '@angular/core';

import { columnMatchesFilter, resolveToggleValue } from './generic-table-cell-format';
import type { ColumnDef, ColumnToggleConfig, ColumnToggleGroup } from './generic-table.types';

export type TextFilterMap = Readonly<Record<string, string>>;
export type ToggleFilterMap = Readonly<Record<string, ReadonlySet<string>>>;

export interface GenericTableToggleOption {
  value: string;
  count: number;
}

export interface GenericTableToggleFacet {
  key: string;
  columnKey: string;
  groupId: string;
  label: string;
  options: GenericTableToggleOption[];
}

export interface ResolvedToggleGroup<T> {
  key: string;
  columnKey: string;
  groupId: string;
  label: string;
  getValues: (row: T) => string | readonly string[] | null | undefined;
}

export interface GenericTableFilterResult<T> {
  rows: readonly T[];
  facets: GenericTableToggleFacet[];
}

export function toggleSelectionKey(columnKey: string, groupId: string): string {
  return `${columnKey}::${groupId}`;
}

export function isColumnToggleConfig<T>(
  value: ColumnDef<T>['toggleable'],
): value is ColumnToggleConfig<T> {
  return typeof value === 'object' && value != null && Array.isArray(value.groups);
}

export function isColumnToggleable<T>(column: ColumnDef<T>): boolean {
  return column.toggleable === true || isColumnToggleConfig(column.toggleable);
}

export function resolveToggleGroups<T>(columns: readonly ColumnDef<T>[]): ResolvedToggleGroup<T>[] {
  const resolved: ResolvedToggleGroup<T>[] = [];

  for (const column of columns) {
    for (const group of columnToggleGroups(column)) {
      resolved.push({
        key: toggleSelectionKey(column.key, group.id),
        columnKey: column.key,
        groupId: group.id,
        label: group.label ?? column.header,
        getValues: group.getValues,
      });
    }
  }

  return resolved;
}

export function normalizeToggleValues(
  raw: string | readonly string[] | null | undefined,
): string[] {
  if (raw == null) {
    return [];
  }

  if (typeof raw === 'string') {
    return [raw.trim()];
  }

  return raw.map((value) => String(value).trim());
}

export function sortToggleOptions(
  options: GenericTableToggleOption[],
): GenericTableToggleOption[] {
  return options.sort((a, b) => {
    if (a.value === '' || b.value === '') {
      return a.value === b.value ? 0 : a.value === '' ? 1 : -1;
    }

    return a.value.localeCompare(b.value, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

/**
 * Filters rows and derives facet counts in a single pass over the data.
 *
 * A facet's counts are computed against the rows that survive every *other* group, so
 * narrowing one group updates its siblings' counts without zeroing out its own options.
 */
export function applyFilters<T>(
  rows: readonly T[],
  searchableColumns: readonly ColumnDef<T>[],
  groups: readonly ResolvedToggleGroup<T>[],
  text: TextFilterMap,
  toggles: ToggleFilterMap,
): GenericTableFilterResult<T> {
  const needles = searchableColumns
    .map((column) => ({ column, needle: (text[column.key] ?? '').trim().toLocaleLowerCase() }))
    .filter((entry) => entry.needle.length > 0);

  if (needles.length === 0 && groups.length === 0) {
    return { rows, facets: [] };
  }

  const rowCount = rows.length;
  const textPass = new Uint8Array(rowCount);

  for (let index = 0; index < rowCount; index++) {
    textPass[index] = needles.every((entry) =>
      columnMatchesFilter(entry.column, rows[index], entry.needle),
    )
      ? 1
      : 0;
  }

  const groupValues: string[][][] = [];
  const groupPass: Uint8Array[] = [];
  const failCount = new Uint16Array(rowCount);

  for (const group of groups) {
    const selected = toggles[group.key];
    const isActive = (selected?.size ?? 0) > 0;
    const values: string[][] = new Array(rowCount);
    const pass = new Uint8Array(rowCount);

    for (let index = 0; index < rowCount; index++) {
      const rowValues = normalizeToggleValues(group.getValues(rows[index]));
      values[index] = rowValues;

      const matches = !isActive || rowValues.some((value) => selected!.has(value));
      pass[index] = matches ? 1 : 0;

      if (!matches) {
        failCount[index]++;
      }
    }

    groupValues.push(values);
    groupPass.push(pass);
  }

  const result: T[] = [];

  for (let index = 0; index < rowCount; index++) {
    if (textPass[index] === 1 && failCount[index] === 0) {
      result.push(rows[index]);
    }
  }

  const facets = groups.map((group, groupIndex) => {
    const values = groupValues[groupIndex];
    const pass = groupPass[groupIndex];
    const counts = new Map<string, number>();
    const universe = new Set<string>();

    for (let index = 0; index < rowCount; index++) {
      const rowValues = values[index];

      for (const value of rowValues) {
        universe.add(value);
      }

      if (textPass[index] === 0 || failCount[index] - (pass[index] === 1 ? 0 : 1) !== 0) {
        continue;
      }

      for (const value of rowValues.length > 1 ? new Set(rowValues) : rowValues) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    for (const value of toggles[group.key] ?? []) {
      universe.add(value);
    }

    return {
      key: group.key,
      columnKey: group.columnKey,
      groupId: group.groupId,
      label: group.label,
      options: sortToggleOptions(
        [...universe].map((value) => ({ value, count: counts.get(value) ?? 0 })),
      ),
    };
  });

  return { rows: result, facets };
}

/** Mutable text + toggle selections. Instantiated twice: once for applied, once for modal drafts. */
export class GenericTableFilterValues {
  readonly text = signal<TextFilterMap>({});
  readonly toggles = signal<ToggleFilterMap>({});

  readonly activeCount = computed(
    () => Object.keys(this.text()).length + Object.keys(this.toggles()).length,
  );

  readonly isActive = computed(() => this.activeCount() > 0);

  textValue(key: string): string {
    return this.text()[key] ?? '';
  }

  isSelected(key: string, value: string): boolean {
    return this.toggles()[key]?.has(value) === true;
  }

  selectedCount(key: string): number {
    return this.toggles()[key]?.size ?? 0;
  }

  setText(key: string, value: string): void {
    this.text.update((current) => {
      if (value.trim().length === 0) {
        if (!(key in current)) {
          return current;
        }

        const next = { ...current };
        delete next[key];
        return next;
      }

      return current[key] === value ? current : { ...current, [key]: value };
    });
  }

  setToggle(key: string, value: string, checked: boolean): void {
    this.toggles.update((current) => {
      const next = new Set(current[key] ?? []);

      if (checked) {
        next.add(value);
      } else {
        next.delete(value);
      }

      if (next.size === 0) {
        if (!(key in current)) {
          return current;
        }

        const without = { ...current };
        delete without[key];
        return without;
      }

      return { ...current, [key]: next };
    });
  }

  clear(): void {
    if (Object.keys(this.text()).length > 0) {
      this.text.set({});
    }

    if (Object.keys(this.toggles()).length > 0) {
      this.toggles.set({});
    }
  }

  copyFrom(source: GenericTableFilterValues): void {
    this.text.set({ ...source.text() });

    const toggles: Record<string, ReadonlySet<string>> = {};

    for (const [key, value] of Object.entries(source.toggles())) {
      toggles[key] = new Set(value);
    }

    this.toggles.set(toggles);
  }

  /** Drops selections whose column or toggle group no longer exists. */
  prune(validTextKeys: ReadonlySet<string>, validToggleKeys: ReadonlySet<string>): void {
    this.text.update((current) => retainKeys(current, validTextKeys));
    this.toggles.update((current) => retainKeys(current, validToggleKeys));
  }
}

/**
 * Which facet groups are collapsed and which have had their option list expanded past
 * the visible cap. Held outside the filter components so the rail keeps its shape across
 * close/reopen and hands the same view to the modal.
 */
export class GenericTableFilterUiState {
  private readonly collapsed = signal<ReadonlySet<string>>(new Set());
  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  isCollapsed(key: string): boolean {
    return this.collapsed().has(key);
  }

  isExpanded(key: string): boolean {
    return this.expanded().has(key);
  }

  toggleCollapsed(key: string): void {
    this.collapsed.update((current) => toggleMembership(current, key));
  }

  toggleExpanded(key: string): void {
    this.expanded.update((current) => toggleMembership(current, key));
  }
}

function toggleMembership(current: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(current);

  if (!next.delete(key)) {
    next.add(key);
  }

  return next;
}

function columnToggleGroups<T>(column: ColumnDef<T>): ColumnToggleGroup<T>[] {
  if (column.toggleable === true) {
    return [
      {
        id: 'value',
        label: column.header,
        getValues: (row) => resolveToggleValue(column, row),
      },
    ];
  }

  if (isColumnToggleConfig(column.toggleable)) {
    return column.toggleable.groups;
  }

  return [];
}

function retainKeys<V>(
  current: Readonly<Record<string, V>>,
  valid: ReadonlySet<string>,
): Readonly<Record<string, V>> {
  const stale = Object.keys(current).filter((key) => !valid.has(key));

  if (stale.length === 0) {
    return current;
  }

  const next = { ...current };

  for (const key of stale) {
    delete next[key];
  }

  return next;
}
