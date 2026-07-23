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
  templateUrl: './generic-table-cell-value.component.html',
  styleUrl: './generic-table-cell-value.component.scss',
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
