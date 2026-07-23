import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Animated progress bar cell. `value` is a number 0–100 (or coercible string).
 */
@Component({
  selector: 'app-generic-table-progress-bar-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gt-progress" [attr.title]="percent() + '%'" [attr.aria-label]="percent() + ' percent'">
      <div class="gt-progress__track">
        <div class="gt-progress__fill" [style.width.%]="percent()"></div>
      </div>
      <span class="gt-progress__label">{{ percent() }}%</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .gt-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .gt-progress__track {
      flex: 1 1 auto;
      min-width: 0;
      height: 0.375rem;
      overflow: hidden;
      background: var(--color-row-hover, #f2f2f2);
      border-radius: 999px;
    }

    .gt-progress__fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        var(--color-primary, #1565c0),
        color-mix(in srgb, var(--color-primary, #1565c0) 65%, #7c4dff)
      );
      transform-origin: left center;
      animation: gt-progress-grow 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .gt-progress__label {
      flex-shrink: 0;
      min-width: 2.25rem;
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
      color: var(--color-text-muted, rgb(0 0 0 / 60%));
      text-align: end;
    }

    @keyframes gt-progress-grow {
      from {
        transform: scaleX(0);
        opacity: 0.4;
      }
      to {
        transform: scaleX(1);
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .gt-progress__fill {
        animation: none;
      }
    }
  `,
})
export class ProgressBarCellComponent<T = unknown> {
  readonly value = input.required<unknown>();
  readonly row = input<T>();
  readonly column = input<ColumnDef<T>>();

  readonly percent = computed(() => {
    const raw = this.value();
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(n)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(n)));
  });
}
