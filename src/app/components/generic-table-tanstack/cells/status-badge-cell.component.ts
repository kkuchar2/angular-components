import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Shared status-badge cell for `ColumnDef.cellComponent`.
 * Styles known values (`active` / `inactive` / `pending`); unknown values still render.
 */
@Component({
  selector: 'app-generic-table-status-badge-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClass()">{{ label() }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    .gt-status-badge {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      padding: 0.125rem 0.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      border-radius: 999px;
      color: var(--color-text, rgb(0 0 0 / 87%));
      background: var(--color-row-hover, #f2f2f2);
    }

    .gt-status-badge--active {
      color: #0d6832;
      background: #e6f4ea;
    }

    .gt-status-badge--inactive {
      color: #5f6368;
      background: #f1f3f4;
    }

    .gt-status-badge--pending {
      color: #8a5a00;
      background: #fef7e0;
    }

    :host-context(html[data-theme='dark']) {
      .gt-status-badge {
        color: #c8c8c8;
        background: rgb(200 200 200 / 10%);
      }

      .gt-status-badge--active {
        color: #8fd4a8;
        background: rgb(129 201 149 / 12%);
      }

      .gt-status-badge--inactive {
        color: #a8a8a8;
        background: rgb(168 168 168 / 10%);
      }

      .gt-status-badge--pending {
        color: #e6c76a;
        background: rgb(253 214 99 / 10%);
      }
    }
  `,
})
export class StatusBadgeCellComponent<T = unknown> {
  /** Resolved cell value (`cell?.(row) ?? row[key]`). */
  readonly value = input.required<unknown>();
  /** Full row — accepted so `NgComponentOutlet` inputs bind cleanly. */
  readonly row = input<T>();
  /** Column def — accepted so `NgComponentOutlet` inputs bind cleanly. */
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
