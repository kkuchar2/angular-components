import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[appContextMenuPanel]',
})
export class ContextMenuPanelDirective {
  readonly templateRef = inject(TemplateRef<unknown>);
}
