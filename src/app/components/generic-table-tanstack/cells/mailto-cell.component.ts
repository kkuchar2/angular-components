import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Mailto link cell. `value` should be an email address.
 */
@Component({
  selector: 'app-generic-table-mailto-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mailto-cell.component.html',
  styleUrl: './mailto-cell.component.scss',
})
export class MailtoCellComponent<T = unknown> {
  readonly value = input.required<unknown>();
  readonly row = input<T>();
  readonly column = input<ColumnDef<T>>();

  readonly email = computed(() => {
    const raw = this.value();
    if (raw == null) {
      return '';
    }
    const text = String(raw).trim();
    return text.includes('@') ? text : '';
  });
}
