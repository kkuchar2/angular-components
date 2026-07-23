import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

type Presence = 'online' | 'away' | 'offline';

/**
 * Presence cell with a softly pulsing status dot.
 * `value` accepts `online` | `away` | `offline` (case-insensitive).
 */
@Component({
  selector: 'app-generic-table-presence-pulse-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './presence-pulse-cell.component.html',
  styleUrl: './presence-pulse-cell.component.scss',
})
export class PresencePulseCellComponent<T = unknown> {
  readonly value = input.required<unknown>();
  readonly row = input<T>();
  readonly column = input<ColumnDef<T>>();

  readonly presence = computed((): Presence => {
    const text = String(this.value() ?? '')
      .trim()
      .toLowerCase();
    if (text === 'online' || text === 'away' || text === 'offline') {
      return text;
    }
    if (text === 'true' || text === '1' || text === 'active') {
      return 'online';
    }
    if (text === 'false' || text === '0' || text === 'inactive') {
      return 'offline';
    }
    return 'offline';
  });

  readonly label = computed(() => this.presence());
}
