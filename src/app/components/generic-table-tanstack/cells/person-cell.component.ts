import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Person cell: initials avatar + display name from `value`.
 */
@Component({
  selector: 'app-generic-table-person-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-cell.component.html',
  styleUrl: './person-cell.component.scss',
})
export class PersonCellComponent<T = unknown> {
  readonly value = input.required<unknown>();
  readonly row = input<T>();
  readonly column = input<ColumnDef<T>>();

  readonly label = computed(() => {
    const raw = this.value();
    return raw == null ? '' : String(raw).trim();
  });

  readonly initials = computed(() => {
    const parts = this.label().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}
