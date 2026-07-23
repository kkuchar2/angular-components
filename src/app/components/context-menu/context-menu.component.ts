import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  contentChild,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { LucideDynamicIcon, LucideEllipsisVertical } from '@lucide/angular';
import { filter, Subscription } from 'rxjs';

import { ContextMenuPanelDirective } from './context-menu-panel.directive';
import type {
  ContextMenuDetailField,
  ContextMenuItem,
  ContextMenuVariant,
} from './context-menu.types';

/**
 * Accessible kebab menu backed by CDK Overlay.
 *
 * - `variant="actions"` (default): list of {@link ContextMenuItem}s; emits `(itemSelect)`.
 * - `variant="details"`: larger panel with optional `title`, structured `[details]`
 *   fields, or a projected `<ng-template appContextMenuPanel>`.
 */
@Component({
  selector: 'app-context-menu',
  imports: [NgTemplateOutlet, LucideDynamicIcon],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuComponent {
  private static idCounter = 0;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly LucideEllipsisVertical = LucideEllipsisVertical;

  readonly controlId = `context-menu-${++ContextMenuComponent.idCounter}`;
  readonly menuId = `${this.controlId}-menu`;
  readonly titleId = `${this.controlId}-title`;

  readonly variant = input<ContextMenuVariant>('actions');
  readonly items = input<ContextMenuItem[]>([]);
  /** Structured fields for the details variant (ignored when a panel template is projected). */
  readonly details = input<ContextMenuDetailField[]>([]);
  /** Optional heading shown above details content. */
  readonly title = input<string | null>(null);
  readonly disabled = input(false);
  /** Accessible name for the trigger button. */
  readonly ariaLabel = input('Open menu');

  readonly itemSelect = output<ContextMenuItem>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  readonly menuTemplate = viewChild.required<TemplateRef<unknown>>('menuTemplate');
  readonly panelDirective = contentChild(ContextMenuPanelDirective);

  readonly isOpen = signal(false);
  readonly focusedIndex = signal(-1);

  private overlayRef: OverlayRef | null = null;
  private overlaySubscriptions: Subscription[] = [];

  constructor() {
    inject(ScrollDispatcher)
      .scrolled()
      .pipe(
        filter(() => this.isOpen()),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.close());

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  itemDomId(index: number): string {
    return `${this.controlId}-item-${index}`;
  }

  onTriggerClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.toggle();
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.open({ focusFirst: this.variant() === 'actions' });
    }
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }

    this.isOpen() ? this.close() : this.open();
  }

  open(options: { focusFirst?: boolean } = {}): void {
    if (this.disabled() || this.isOpen()) {
      return;
    }

    const isDetails = this.variant() === 'details';

    this.isOpen.set(true);
    this.focusedIndex.set(
      options.focusFirst && !isDetails ? this.firstEnabledIndex() : -1,
    );

    const trigger = this.triggerRef().nativeElement;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(trigger)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(8)
      .withPositions([
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
        { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
      hasBackdrop: true,
      backdropClass: 'context-menu__backdrop',
      panelClass: isDetails
        ? ['context-menu__overlay-pane', 'context-menu__overlay-pane--details']
        : 'context-menu__overlay-pane',
    });

    this.overlayRef.attach(new TemplatePortal(this.menuTemplate(), this.viewContainerRef));

    this.overlaySubscriptions.push(
      this.overlayRef.backdropClick().subscribe(() => this.close()),
      this.overlayRef.keydownEvents().subscribe((event) => this.onMenuKeyDown(event)),
    );

    this.opened.emit();

    if (options.focusFirst && !isDetails) {
      queueMicrotask(() => this.focusItem(this.focusedIndex()));
    }
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    this.destroyOverlay();
    this.triggerRef().nativeElement.focus({ preventScroll: true });
    this.closed.emit();
  }

  onItemClick(event: MouseEvent, item: ContextMenuItem): void {
    event.stopPropagation();
    event.preventDefault();

    if (item.disabled) {
      return;
    }

    this.itemSelect.emit(item);
    this.close();
  }

  onMenuKeyDown(event: KeyboardEvent): void {
    if (this.variant() === 'details') {
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        this.close();
      }

      return;
    }

    const items = this.items();

    if (items.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }

      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusItem(this.firstEnabledIndex());
        break;
      case 'End':
        event.preventDefault();
        this.focusItem(this.lastEnabledIndex());
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const index = this.focusedIndex();
        const item = index >= 0 ? items[index] : undefined;

        if (item && !item.disabled) {
          this.itemSelect.emit(item);
          this.close();
        }

        break;
      }
      case 'Tab':
        this.close();
        break;
      default:
        break;
    }
  }

  private moveFocus(delta: 1 | -1): void {
    const items = this.items();
    const count = items.length;

    if (count === 0) {
      return;
    }

    let index = this.focusedIndex();

    for (let step = 0; step < count; step++) {
      index = (index + delta + count) % count;

      if (!items[index]?.disabled) {
        this.focusItem(index);
        return;
      }
    }
  }

  private focusItem(index: number): void {
    if (index < 0) {
      return;
    }

    this.focusedIndex.set(index);
    const el = document.getElementById(this.itemDomId(index));
    el?.focus({ preventScroll: true });
  }

  private firstEnabledIndex(): number {
    return this.items().findIndex((item) => !item.disabled);
  }

  private lastEnabledIndex(): number {
    const items = this.items();

    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i]?.disabled) {
        return i;
      }
    }

    return -1;
  }

  private destroyOverlay(): void {
    this.overlaySubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.overlaySubscriptions = [];
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
