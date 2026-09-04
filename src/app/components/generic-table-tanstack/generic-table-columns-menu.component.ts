import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideChevronDown, LucideColumns3, LucideDynamicIcon } from '@lucide/angular';

import type { ColumnDef } from './generic-table.types';

const MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

@Component({
  selector: 'app-generic-table-columns-menu',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, LucideDynamicIcon],
  templateUrl: './generic-table-columns-menu.component.html',
  styleUrl: './generic-table-columns-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericTableColumnsMenuComponent<T = unknown> {
  private static instanceCount = 0;

  readonly LucideColumns3 = LucideColumns3;
  readonly LucideChevronDown = LucideChevronDown;
  readonly positions = MENU_POSITIONS;
  readonly menuId = `gtt-columns-menu-${++GenericTableColumnsMenuComponent.instanceCount}`;

  readonly columns = input.required<readonly ColumnDef<T>[]>();
  readonly visibleKeys = input.required<ReadonlySet<string>>();
  readonly disabled = input(false);

  readonly visibilityChange = output<{ key: string; visible: boolean }>();
  readonly showAll = output<void>();

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  readonly isOpen = signal(false);

  readonly visibleCount = computed(
    () => this.columns().filter((column) => this.visibleKeys().has(column.key)).length,
  );

  readonly allVisible = computed(() => this.visibleCount() === this.columns().length);

  /** The last visible column can't be hidden — an empty grid has no usable layout. */
  readonly isLocked = computed(() => this.visibleCount() <= 1);

  toggleMenu(): void {
    if (this.disabled()) {
      return;
    }

    this.isOpen.update((open) => !open);
  }

  close(restoreFocus = false): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);

    if (restoreFocus) {
      this.trigger().nativeElement.focus({ preventScroll: true });
    }
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
    }
  }

  isVisible(key: string): boolean {
    return this.visibleKeys().has(key);
  }

  isOptionDisabled(key: string): boolean {
    return this.disabled() || (this.isLocked() && this.isVisible(key));
  }

  onOptionChange(key: string, event: Event): void {
    if (this.disabled()) {
      return;
    }

    this.visibilityChange.emit({
      key,
      visible: (event.target as HTMLInputElement).checked,
    });
  }
}
