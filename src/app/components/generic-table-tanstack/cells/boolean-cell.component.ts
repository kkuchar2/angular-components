import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Boolean / truthy chip cell. Renders Yes/No from boolean or common string values.
 */
@Component({
  selector: 'app-generic-table-boolean-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="gt-boolean-cell" [class]="chipClass()">{{ label() }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    .gt-boolean-cell {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      border-radius: 999px;
    }

    .gt-boolean-cell--yes {
      color: #0d6832;
      background: #e6f4ea;
    }

    .gt-boolean-cell--no {
      color: #5f6368;
      background: #f1f3f4;
    }

    :host-context(html[data-theme='dark']) {
      .gt-boolean-cell--yes {
        color: #8fd4a8;
        background: rgb(129 201 149 / 12%);
      }

      .gt-boolean-cell--no {
        color: #a8a8a8;
        background: rgb(168 168 168 / 10%);
      }
    }
  `,
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
