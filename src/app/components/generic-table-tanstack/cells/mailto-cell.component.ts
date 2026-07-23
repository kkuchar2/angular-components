import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Mailto link cell. `value` should be an email address.
 */
@Component({
  selector: 'app-generic-table-mailto-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (email(); as address) {
      <a
        class="gt-mailto-cell"
        [href]="'mailto:' + address"
        (click)="$event.stopPropagation()"
        (pointerdown)="$event.stopPropagation()"
      >
        {{ address }}
      </a>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
      min-width: 0;
    }

    .gt-mailto-cell {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--color-primary, #1565c0);
      text-decoration: none;
    }

    .gt-mailto-cell:hover {
      text-decoration: underline;
    }
  `,
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
