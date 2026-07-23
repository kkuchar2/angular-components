import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Person cell: initials avatar + display name from `value`.
 */
@Component({
  selector: 'app-generic-table-person-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="gt-person-cell">
      <span class="gt-person-cell__avatar" aria-hidden="true">{{ initials() }}</span>
      <span class="gt-person-cell__name">{{ label() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
      min-width: 0;
    }

    .gt-person-cell {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
      max-width: 100%;
    }

    .gt-person-cell__avatar {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--color-surface, #fff);
      background: var(--color-primary, #1565c0);
      border-radius: 50%;
    }

    .gt-person-cell__name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host-context(html[data-theme='dark']) {
      .gt-person-cell__avatar {
        color: #1e1e1e;
        background: #b0b0b0;
      }

      .gt-person-cell__name {
        color: #d0d0d0;
      }
    }
  `,
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
