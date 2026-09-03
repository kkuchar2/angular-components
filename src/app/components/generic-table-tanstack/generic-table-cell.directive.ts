import { Directive, inject, input, TemplateRef } from '@angular/core';

import { GenericTableCellContext } from './generic-table.types';

@Directive({
  selector: 'ng-template[appGenericTableCell]',
})
export class GenericTableCellDirective<T = unknown> {

  readonly columnKey = input.required<string>({ alias: 'appGenericTableCell' });

  readonly for = input<readonly T[]>([], { alias: 'appGenericTableCellFor' });

  readonly templateRef = inject<TemplateRef<GenericTableCellContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: GenericTableCellDirective<T>,
    _context: unknown,
  ): _context is GenericTableCellContext<T> {
    return true;
  }
}
