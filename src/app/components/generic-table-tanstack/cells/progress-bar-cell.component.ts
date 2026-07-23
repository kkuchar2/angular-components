import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Animated progress bar cell. `value` is a number 0–100 (or coercible string).
 */
@Component({
  selector: 'app-generic-table-progress-bar-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-bar-cell.component.html',
  styleUrl: './progress-bar-cell.component.scss',
})
export class ProgressBarCellComponent<T = unknown> {
  readonly value = input.required<unknown>();
  readonly row = input<T>();
  readonly column = input<ColumnDef<T>>();

  readonly percent = computed(() => {
    const raw = this.value();
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(n)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(n)));
  });
}
