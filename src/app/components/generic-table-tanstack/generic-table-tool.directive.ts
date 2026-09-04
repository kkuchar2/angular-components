import { Directive, booleanAttribute, input } from '@angular/core';

/**
 * Marks a consumer-supplied control for the table toolbar's trailing slot, ahead of the
 * built-in Columns and Export controls.
 *
 * The element is given the toolbar's own button chrome so it matches the built-in
 * controls without the consumer restating any styles. Pass `[gttToolChrome]="false"` to
 * project something that should keep its own appearance.
 *
 * ```html
 * <app-generic-table-tanstack [columns]="columns" [data]="rows()">
 *   <button gttTool (click)="refresh()">Refresh</button>
 * </app-generic-table-tanstack>
 * ```
 */
@Directive({
  selector: '[gttTool]',
  host: {
    class: 'gtt-tool',
    '[class.gtt-control]': 'gttToolChrome()',
  },
})
export class GenericTableToolDirective {
  readonly gttToolChrome = input(true, { transform: booleanAttribute });
}
