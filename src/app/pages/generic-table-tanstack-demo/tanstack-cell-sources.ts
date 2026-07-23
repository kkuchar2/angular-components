/**
 * Source of shared tanstack table cell components for demo code tabs.
 *
 * Regenerate after editing cells:
 *   node scripts/generate-tanstack-cell-sources.mjs
 */
import type { DemoCodeCellTab } from '../../shared/demo-code-block/demo-code.util';

export const tanstackCellSources = {
  StatusBadge: `
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Shared status-badge cell for \`ColumnDef.cellComponent\`.
 * Styles known values (\`active\` / \`inactive\` / \`pending\`); unknown values still render.
 */
@Component({
  selector: 'app-generic-table-status-badge-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <span [class]="badgeClass()">{{ label() }}</span>
  \`,
  styles: \`
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
  \`,
})
export class StatusBadgeCellComponent<T = unknown> {
  /** Resolved cell value (\`cell?.(row) ?? row[key]\`). */
  readonly value = input.required<unknown>();
  /** Full row — accepted so \`NgComponentOutlet\` inputs bind cleanly. */
  readonly row = input<T>();
  /** Column def — accepted so \`NgComponentOutlet\` inputs bind cleanly. */
  readonly column = input<ColumnDef<T>>();

  readonly label = computed(() => {
    const raw = this.value();
    return raw == null ? '' : String(raw);
  });

  readonly badgeClass = computed(() => {
    const slug = this.label().trim().toLowerCase().replace(/\\s+/g, '-');
    const known = slug === 'active' || slug === 'inactive' || slug === 'pending';
    return known ? \`gt-status-badge gt-status-badge--\${slug}\` : 'gt-status-badge';
  });
}
`,
  Person: `
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Person cell: initials avatar + display name from \`value\`.
 */
@Component({
  selector: 'app-generic-table-person-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <span class="gt-person-cell">
      <span class="gt-person-cell__avatar" aria-hidden="true">{{ initials() }}</span>
      <span class="gt-person-cell__name">{{ label() }}</span>
    </span>
  \`,
  styles: \`
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
  \`,
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
    const parts = this.label().split(/\\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}
`,
  Mailto: `
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Mailto link cell. \`value\` should be an email address.
 */
@Component({
  selector: 'app-generic-table-mailto-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
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
  \`,
  styles: \`
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
  \`,
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
`,
  Boolean: `
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Boolean / truthy chip cell. Renders Yes/No from boolean or common string values.
 */
@Component({
  selector: 'app-generic-table-boolean-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <span class="gt-boolean-cell" [class]="chipClass()">{{ label() }}</span>
  \`,
  styles: \`
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
  \`,
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
`,
  PresencePulse: `
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

type Presence = 'online' | 'away' | 'offline';

/**
 * Presence cell with a softly pulsing status dot.
 * \`value\` accepts \`online\` | \`away\` | \`offline\` (case-insensitive).
 */
@Component({
  selector: 'app-generic-table-presence-pulse-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <span class="gt-presence" [class]="'gt-presence gt-presence--' + presence()">
      <span class="gt-presence__dot" aria-hidden="true"></span>
      <span class="gt-presence__label">{{ label() }}</span>
    </span>
  \`,
  styles: \`
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
  \`,
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
`,
  ProgressBar: `
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Animated progress bar cell. \`value\` is a number 0–100 (or coercible string).
 */
@Component({
  selector: 'app-generic-table-progress-bar-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="gt-progress" [attr.title]="percent() + '%'" [attr.aria-label]="percent() + ' percent'">
      <div class="gt-progress__track">
        <div class="gt-progress__fill" [style.width.%]="percent()"></div>
      </div>
      <span class="gt-progress__label">{{ percent() }}%</span>
    </div>
  \`,
  styles: \`
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
  \`,
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
`,
  Trend: `
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ColumnDef } from '../generic-table.types';

/**
 * Numeric delta / trend cell with a slide-in arrow.
 * Positive → up, negative → down, zero → flat.
 */
@Component({
  selector: 'app-generic-table-trend-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <span class="gt-trend" [class]="'gt-trend gt-trend--' + direction()">
      <span class="gt-trend__arrow" aria-hidden="true">{{ arrow() }}</span>
      <span class="gt-trend__value">{{ formatted() }}</span>
    </span>
  \`,
  styles: \`
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
  \`,
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
      return \`+\${body}\`;
    }
    if (d < 0) {
      return \`−\${body}\`;
    }
    return '0';
  });
}
`,
} as const;

export type TanstackCellSourceKey = keyof typeof tanstackCellSources;

/** Build demo code tabs for the given cell component keys (order preserved). */
export function tanstackCellTabs(
  ...keys: TanstackCellSourceKey[]
): DemoCodeCellTab[] {
  return keys.map((key) => ({
    label: key,
    code: tanstackCellSources[key],
  }));
}
