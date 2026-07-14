import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

import type { DropdownLinkCardIcon } from './dropdown-link-card.types';

@Component({
  selector: 'app-dropdown-link-card-icon',
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `
    @if (icon(); as value) {
      @switch (value.type) {
        @case ('image') {
          <img [src]="value.src" [alt]="value.alt ?? ''" [width]="size()" [height]="size()" />
        }
        @case ('lucide') {
          <svg [lucideIcon]="value.icon" [size]="size()" aria-hidden="true"></svg>
        }
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    img {
      display: block;
      object-fit: contain;
    }
  `,
})
export class DropdownLinkCardIconComponent {
  readonly icon = input<DropdownLinkCardIcon | undefined>();
  readonly size = input<number>(20);
}
