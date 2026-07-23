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
  template: `
    <span class="gt-presence" [class]="'gt-presence gt-presence--' + presence()">
      <span class="gt-presence__dot" aria-hidden="true"></span>
      <span class="gt-presence__label">{{ label() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    .gt-presence {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      min-width: 0;
    }

    .gt-presence__dot {
      position: relative;
      flex-shrink: 0;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: currentColor;
    }

    .gt-presence__dot::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1.5px solid currentColor;
      opacity: 0;
    }

    .gt-presence--online {
      color: #1b8a4a;
    }

    .gt-presence--online .gt-presence__dot::after {
      animation: gt-presence-pulse 1.8s ease-out infinite;
    }

    .gt-presence--away {
      color: #b8860b;
    }

    .gt-presence--offline {
      color: #8a8a8a;
    }

    .gt-presence__label {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8125rem;
      font-weight: 500;
      text-transform: capitalize;
      white-space: nowrap;
      color: var(--color-text, rgb(0 0 0 / 87%));
    }

    @keyframes gt-presence-pulse {
      0% {
        transform: scale(0.7);
        opacity: 0.55;
      }
      70% {
        transform: scale(1.7);
        opacity: 0;
      }
      100% {
        opacity: 0;
      }
    }

    :host-context(html[data-theme='dark']) {
      .gt-presence--online {
        color: #6bcf8e;
      }

      .gt-presence--away {
        color: #e0b34d;
      }

      .gt-presence--offline {
        color: #8e8e8e;
      }

      .gt-presence__label {
        color: color-mix(in srgb, var(--color-text, #f0f0f0) 82%, transparent);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .gt-presence--online .gt-presence__dot::after {
        animation: none;
      }
    }
  `,
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
