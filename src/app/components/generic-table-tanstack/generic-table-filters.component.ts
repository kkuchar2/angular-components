import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideChevronDown, LucideDynamicIcon } from '@lucide/angular';

import { CustomInputComponent } from '../custom-input/custom-input';
import {
  GenericTableFilterUiState,
  type GenericTableFilterValues,
  type GenericTableToggleFacet,
} from './generic-table-filter-model';
import type { ColumnDef } from './generic-table.types';

export type GenericTableFiltersLayout = 'rail' | 'grid';

interface FilterGroup {
  facet: GenericTableToggleFacet;
  /** Set only when the group needs its own row because the section holds more than one. */
  heading: string | null;
}

interface FilterSection<T> {
  column: ColumnDef<T>;
  collapseKey: string;
  heading: string;
  /** Only option lists are worth hiding; a lone search field is already one row tall. */
  collapsible: boolean;
  searchable: boolean;
  searchLabel: string;
  groups: FilterGroup[];
}

@Component({
  selector: 'app-generic-table-filters',
  imports: [FormsModule, CustomInputComponent, LucideDynamicIcon],
  templateUrl: './generic-table-filters.component.html',
  styleUrl: './generic-table-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gt-filters',
    '[class.gt-filters--grid]': "layout() === 'grid'",
  },
})
export class GenericTableFiltersComponent<T = unknown> {
  protected readonly LucideChevronDown = LucideChevronDown;

  readonly columns = input.required<readonly ColumnDef<T>[]>();
  readonly facets = input.required<readonly GenericTableToggleFacet[]>();
  readonly values = input.required<GenericTableFilterValues>();
  readonly idPrefix = input.required<string>();
  readonly layout = input<GenericTableFiltersLayout>('rail');
  readonly disabled = input(false);
  readonly showCounts = input(true);
  readonly ui = input(new GenericTableFilterUiState());

  /** Options shown before a group offers to reveal the rest. */
  readonly visibleOptionLimit = input(8);

  readonly sections = computed((): FilterSection<T>[] => {
    const byColumn = new Map<string, GenericTableToggleFacet[]>();

    for (const facet of this.facets()) {
      const existing = byColumn.get(facet.columnKey);

      if (existing) {
        existing.push(facet);
      } else {
        byColumn.set(facet.columnKey, [facet]);
      }
    }

    return this.columns().map((column) => {
      const facets = byColumn.get(column.key) ?? [];

      return {
        column,
        collapseKey: `section::${column.key}`,
        heading: column.header,
        collapsible: facets.length > 0,
        searchable: column.searchable === true,
        searchLabel: `Search ${column.header}`,
        groups: facets.map((facet) => ({
          facet,
          heading: facets.length > 1 || facet.label !== column.header ? facet.label : null,
        })),
      };
    });
  });

  optionId(facetKey: string, value: string): string {
    const safe = value === '' ? '__empty' : encodeURIComponent(value).replaceAll('%', '_');
    return `${this.idPrefix()}-${facetKey.replace('::', '-')}-${safe}`;
  }

  bodyId(key: string): string {
    return `${this.idPrefix()}-${key.replace('::', '-')}-body`;
  }

  optionLabel(value: string): string {
    return value === '' ? '(Empty)' : value;
  }

  isOptionDisabled(facetKey: string, value: string, count: number): boolean {
    return this.disabled() || (count === 0 && !this.values().isSelected(facetKey, value));
  }

  isCollapsed(facetKey: string): boolean {
    return this.ui().isCollapsed(facetKey);
  }

  visibleOptions(facet: GenericTableToggleFacet): GenericTableToggleFacet['options'] {
    if (this.ui().isExpanded(facet.key) || facet.options.length <= this.visibleOptionLimit()) {
      return facet.options;
    }

    return facet.options.slice(0, this.visibleOptionLimit());
  }

  hiddenOptionCount(facet: GenericTableToggleFacet): number {
    if (this.ui().isExpanded(facet.key)) {
      return 0;
    }

    return Math.max(0, facet.options.length - this.visibleOptionLimit());
  }

  isExpanded(facetKey: string): boolean {
    return this.ui().isExpanded(facetKey);
  }

  selectedCount(facetKey: string): number {
    return this.values().selectedCount(facetKey);
  }

  sectionActiveCount(section: FilterSection<T>): number {
    const values = this.values();
    let count = section.searchable && values.textValue(section.column.key) !== '' ? 1 : 0;

    for (const group of section.groups) {
      count += values.selectedCount(group.facet.key);
    }

    return count;
  }

  onToggleCollapsed(facetKey: string): void {
    this.ui().toggleCollapsed(facetKey);
  }

  onToggleExpanded(facetKey: string): void {
    this.ui().toggleExpanded(facetKey);
  }

  onSearch(key: string, value: string): void {
    if (!this.disabled()) {
      this.values().setText(key, value);
    }
  }

  onToggle(facetKey: string, value: string, event: Event): void {
    if (!this.disabled()) {
      this.values().setToggle(facetKey, value, (event.target as HTMLInputElement).checked);
    }
  }
}
