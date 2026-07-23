import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Boolean / truthy chip cell. Renders Yes/No from boolean or common string values.
 */
@Component({
  selector: 'app-generic-table-boolean-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './boolean-cell.component.html',
  styleUrl: './boolean-cell.component.scss',
})
export class BooleanCellComponent<T = unknown> {
  readonly value = input.required<unknown>();
  readonly row = input<T>();
  readonly column = input<ColumnDef<T>>();

  readonly isYes = computed(() => {
    const raw = this.value();
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (typeof raw === 'number') {
      return raw !== 0;
    }
    const text = String(raw ?? '')
      .trim()
      .toLowerCase();
    return text === 'true' || text === 'yes' || text === '1' || text === 'y';
  });

  readonly label = computed(() => (this.isYes() ? 'Yes' : 'No'));

  readonly chipClass = computed(() =>
    this.isYes() ? 'gt-boolean-cell gt-boolean-cell--yes' : 'gt-boolean-cell gt-boolean-cell--no',
  );
}
