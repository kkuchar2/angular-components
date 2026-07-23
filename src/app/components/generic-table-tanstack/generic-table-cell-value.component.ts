import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { LucideCheck, LucideCopy, LucideDynamicIcon } from '@lucide/angular';

import { formatColumnCell, resolveCopyValue } from './generic-table-cell-format';
import type { ColumnDef } from './generic-table.types';

/**
 * Built-in cell renderer for text / uuid / date columns, with optional copy.
 * Used when no custom `appGenericTableCell` template and no `cellComponent` are set.
 */
@Component({
  selector: 'app-generic-table-cell-value',
  imports: [LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="gt-cell-value"
      [class.gt-cell-value--uuid]="isUuid()"
      [class.gt-cell-value--date]="isDate()"
      [class.gt-cell-value--copyable]="copyable()"
    >
      <span class="gt-cell-value__text" [attr.title]="titleAttr()">{{ display() }}</span>

      @if (copyable() && copyText()) {
        <button
          type="button"
          class="gt-cell-value__copy"
          [attr.aria-label]="copied() ? 'Copied' : 'Copy to clipboard'"
          [attr.title]="copied() ? 'Copied' : 'Copy'"
          (click)="onCopy($event)"
          (pointerdown)="$event.stopPropagation()"
        >
          @if (copied()) {
            <svg [lucideIcon]="LucideCheck" [size]="12" aria-hidden="true"></svg>
          } @else {
            <svg [lucideIcon]="LucideCopy" [size]="12" aria-hidden="true"></svg>
          }
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .gt-cell-value {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
      max-width: 100%;
    }

    .gt-cell-value__text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gt-cell-value--uuid .gt-cell-value__text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
        'Courier New', monospace;
      font-size: 0.92em;
      letter-spacing: 0.01em;
    }

    .gt-cell-value__copy {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      color: var(--color-text-muted, rgb(0 0 0 / 55%));
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 4px;
      opacity: 0.55;
      transition:
        opacity 120ms ease,
        color 120ms ease,
        background 120ms ease;
    }

    .gt-cell-value--copyable:hover .gt-cell-value__copy,
    .gt-cell-value__copy:focus-visible {
      opacity: 1;
    }

    .gt-cell-value__copy:hover,
    .gt-cell-value__copy:focus-visible {
      color: var(--color-text, rgb(0 0 0 / 87%));
      background: var(--color-row-hover, #f2f2f2);
      outline: none;
    }
  `,
})
export class GenericTableCellValueComponent<T = unknown> {
  readonly LucideCopy = LucideCopy;
  readonly LucideCheck = LucideCheck;

  readonly column = input.required<ColumnDef<T>>();
  readonly row = input.required<T>();

  readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly display = computed(() => formatColumnCell(this.column(), this.row()));
  readonly copyText = computed(() => resolveCopyValue(this.column(), this.row()));
  readonly copyable = computed(() => this.column().copyable === true);
  readonly isUuid = computed(() => this.column().cellType === 'uuid');
  readonly isDate = computed(() => this.column().cellType === 'date');
  readonly titleAttr = computed(() => {
    const text = this.display();
    return text.length > 24 ? text : null;
  });

  async onCopy(event: Event): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const value = this.copyText();

    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(true);

      if (this.copiedTimer != null) {
        clearTimeout(this.copiedTimer);
      }

      this.copiedTimer = setTimeout(() => {
        this.copied.set(false);
        this.copiedTimer = null;
      }, 1200);
    } catch {
      // Clipboard can fail without permission — keep UI quiet.
    }
  }
}
