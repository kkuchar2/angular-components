import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronsLeft,
  LucideChevronsRight,
  LucideDynamicIcon,
} from '@lucide/angular';

import type { GenericTablePageEvent } from './generic-table.types';

@Component({
  selector: 'app-generic-table-paginator',
  imports: [LucideDynamicIcon],
  templateUrl: './generic-table-paginator.component.html',
  styleUrl: './generic-table-paginator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gtt-paginator',
    role: 'navigation',
    'aria-label': 'Table pagination',
  },
})
export class GenericTablePaginatorComponent {
  private static instanceCount = 0;

  readonly LucideChevronsLeft = LucideChevronsLeft;
  readonly LucideChevronLeft = LucideChevronLeft;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideChevronsRight = LucideChevronsRight;

  readonly selectId = `gtt-page-size-${++GenericTablePaginatorComponent.instanceCount}`;

  readonly length = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([]);
  readonly disabled = input(false);

  readonly page = output<GenericTablePageEvent>();

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.length() / Math.max(this.pageSize(), 1))),
  );

  readonly currentPage = computed(() =>
    Math.min(Math.max(this.pageIndex(), 0), this.pageCount() - 1),
  );

  /** Always offers the active size, even when the caller forgot to list it. */
  readonly sizeOptions = computed(() => {
    const options = new Set(this.pageSizeOptions().filter((option) => option > 0));

    if (options.size === 0) {
      return [];
    }

    options.add(this.pageSize());
    return [...options].sort((a, b) => a - b);
  });

  readonly rangeLabel = computed(() => {
    const length = this.length();

    if (length === 0) {
      return '0 of 0';
    }

    const start = this.currentPage() * this.pageSize();
    return `${start + 1}–${Math.min(start + this.pageSize(), length)} of ${length}`;
  });

  readonly isFirstPage = computed(() => this.currentPage() === 0);
  readonly isLastPage = computed(() => this.currentPage() >= this.pageCount() - 1);

  goToPage(pageIndex: number): void {
    const target = Math.min(Math.max(pageIndex, 0), this.pageCount() - 1);
    const previousPageIndex = this.currentPage();

    if (this.disabled() || target === previousPageIndex) {
      return;
    }

    this.page.emit({
      pageIndex: target,
      previousPageIndex,
      pageSize: this.pageSize(),
      length: this.length(),
    });
  }

  onPageSizeChange(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);

    if (this.disabled() || !Number.isFinite(pageSize) || pageSize <= 0) {
      return;
    }

    const previousPageIndex = this.currentPage();

    this.page.emit({
      // Keep the first row of the current page in view instead of jumping to the start.
      pageIndex: Math.floor((previousPageIndex * this.pageSize()) / pageSize),
      previousPageIndex,
      pageSize,
      length: this.length(),
    });
  }
}
