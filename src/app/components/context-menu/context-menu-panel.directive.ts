import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Marks an `<ng-template>` as custom body content for the details variant of
 * {@link ContextMenuComponent}. When present, structured `[details]` fields are
 * ignored.
 *
 * ```html
 * <app-context-menu variant="details" title="Alice">
 *   <ng-template appContextMenuPanel>
 *     <p>Custom detail markup…</p>
 *   </ng-template>
 * </app-context-menu>
 * ```
 */
@Directive({
  selector: 'ng-template[appContextMenuPanel]',
})
export class ContextMenuPanelDirective {
  readonly templateRef = inject(TemplateRef<unknown>);
}
