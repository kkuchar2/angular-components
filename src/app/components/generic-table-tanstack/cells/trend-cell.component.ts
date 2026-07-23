import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Numeric delta / trend cell with a slide-in arrow.
 * Positive → up, negative → down, zero → flat.
 */
@Component({
  selector: 'app-generic-table-trend-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="gt-trend" [class]="'gt-trend gt-trend--' + direction()">
      <span class="gt-trend__arrow" aria-hidden="true">{{ arrow() }}</span>
      <span class="gt-trend__value">{{ formatted() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    .gt-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.45rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      border-radius: 6px;
      animation: gt-trend-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .gt-trend--up {
      color: #0d6832;
      background: #e6f4ea;
    }

    .gt-trend--down {
      color: #a12828;
      background: #fdecea;
    }

    .gt-trend--flat {
      color: #5f6368;
      background: #f1f3f4;
    }

    .gt-trend__arrow {
      display: inline-flex;
      animation: gt-trend-nudge 1.4s ease-in-out infinite;
    }

    .gt-trend--flat .gt-trend__arrow {
      animation: none;
    }

    .gt-trend--up .gt-trend__arrow {
      --gt-trend-nudge: -2px;
    }

    .gt-trend--down .gt-trend__arrow {
      --gt-trend-nudge: 2px;
    }

    @keyframes gt-trend-in {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes gt-trend-nudge {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(var(--gt-trend-nudge, 0));
      }
    }

    :host-context(html[data-theme='dark']) {
      .gt-trend--up {
        color: #81c995;
        background: rgb(129 201 149 / 14%);
      }

      .gt-trend--down {
        color: #f2b8b5;
        background: rgb(242 184 181 / 12%);
      }

      .gt-trend--flat {
        color: #b0b0b0;
        background: rgb(176 176 176 / 10%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .gt-trend,
      .gt-trend__arrow {
        animation: none;
      }
    }
  `,
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
