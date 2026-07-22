import { Directive, inject, input, TemplateRef } from '@angular/core';

import { GenericTableCellContext } from './generic-table.types';

/**
 * Marks an `<ng-template>` as the custom renderer for a table column.
 *
 * Bind the same collection you pass to the table's `[data]` input via
 * `[appGenericTableCellFor]` so `let-row` is typed as your row model instead of
 * `unknown`. This mirrors how `*ngFor` infers its item type from `ngForOf`; the
 * binding is used only for type inference and never read at runtime.
 *
 * Usage:
 * ```html
 * <app-generic-table-tanstack [columns]="columns" [data]="rows()">
 *   <ng-template appGenericTableCell="status" [appGenericTableCellFor]="rows()" let-row>
 *     <span class="badge">{{ row.status }}</span>
 *   </ng-template>
 * </app-generic-table-tanstack>
 * ```
 */
@Directive({
  selector: 'ng-template[appGenericTableCell]',
})
export class GenericTableCellDirective<T = unknown> {
  /** The `key` of the column this template renders. */
  readonly columnKey = input.required<string>({ alias: 'appGenericTableCell' });

  /**
   * Type anchor for `let-row`. Bind the same value as the table's `[data]`
   * input; only its type is used, so the runtime value is irrelevant.
   */
  readonly for = input<readonly T[]>([], { alias: 'appGenericTableCellFor' });

  readonly templateRef = inject<TemplateRef<GenericTableCellContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: GenericTableCellDirective<T>,
    _context: unknown,
  ): _context is GenericTableCellContext<T> {
    return true;
  }
}
