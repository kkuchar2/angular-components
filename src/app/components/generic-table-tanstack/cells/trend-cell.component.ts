import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Numeric delta / trend cell with a slide-in arrow.
 * Positive → up, negative → down, zero → flat.
 */
@Component({
  selector: 'app-generic-table-trend-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trend-cell.component.html',
  styleUrl: './trend-cell.component.scss',
})
export class TrendCellComponent<T = unknown> {
  readonly value = input.required<unknown>();
  readonly row = input<T>();
  readonly column = input<ColumnDef<T>>();

  readonly delta = computed(() => {
    const raw = this.value();
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : 0;
  });

  readonly direction = computed(() => {
    const d = this.delta();
    if (d > 0) {
      return 'up';
    }
    if (d < 0) {
      return 'down';
    }
    return 'flat';
  });

  readonly arrow = computed(() => {
    const dir = this.direction();
    if (dir === 'up') {
      return '↑';
    }
    if (dir === 'down') {
      return '↓';
    }
    return '→';
  });

  readonly formatted = computed(() => {
    const d = this.delta();
    const abs = Math.abs(d);
    const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
    if (d > 0) {
      return `+${body}`;
    }
    if (d < 0) {
      return `−${body}`;
    }
    return '0';
  });
}
