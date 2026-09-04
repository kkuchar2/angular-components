import { Directive, inject, input, TemplateRef } from '@angular/core';

import { GenericTableCellContext } from './generic-table.types';

@Directive({
  selector: 'ng-template[appGenericTableCell]',
})
export class GenericTableCellDirective<T = unknown> {
  readonly columnKey = input.required<string>({ alias: 'appGenericTableCell' });

  // eslint-disable-next-line @angular-eslint/no-input-rename -- public template API
  readonly for = input<readonly T[]>([], { alias: 'appGenericTableCellFor' });

  readonly templateRef = inject<TemplateRef<GenericTableCellContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: GenericTableCellDirective<T>,
    context: unknown,
  ): context is GenericTableCellContext<T> {
    void context;
    return true;
  }
}
