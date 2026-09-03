import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

@Component({
  selector: 'app-generic-table-status-badge-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge-cell.component.html',
  styleUrl: './status-badge-cell.component.scss',
})
export class StatusBadgeCellComponent<T = unknown> {

  readonly value = input.required<unknown>();

  readonly row = input<T>();

  readonly column = input<ColumnDef<T>>();

  readonly label = computed(() => {
    const raw = this.value();
    return raw == null ? '' : String(raw);
  });

  readonly badgeClass = computed(() => {
    const slug = this.label().trim().toLowerCase().replace(/\s+/g, '-');
    const known = slug === 'active' || slug === 'inactive' || slug === 'pending';
    return known ? `gt-status-badge gt-status-badge--${slug}` : 'gt-status-badge';
  });
}
