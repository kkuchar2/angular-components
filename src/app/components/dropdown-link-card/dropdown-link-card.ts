import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { filter, Subscription } from 'rxjs';

import { DropdownLinkCardIconComponent } from './dropdown-link-card-icon.component';
import type { DropdownLinkCardIcon } from './dropdown-link-card.types';

export type { DropdownLinkCardIcon } from './dropdown-link-card.types';
export type { DropdownLinkCardIconImage, DropdownLinkCardIconLucide } from './dropdown-link-card.types';

export interface DropdownLink {
  label: string;
  url: string;
  icon?: DropdownLinkCardIcon;
  description?: string;
}

@Component({
  selector: 'app-dropdown-link-card',
  imports: [DropdownLinkCardIconComponent],
  templateUrl: './dropdown-link-card.html',
  styleUrl: './dropdown-link-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownLinkCardComponent {
  private static idCounter = 0;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  readonly controlId = `dropdown-link-card-${++DropdownLinkCardComponent.idCounter}`;
  readonly menuId = `${this.controlId}-menu`;

  readonly title = input('');
  readonly icon = input<DropdownLinkCardIcon | undefined>(undefined);
  readonly links = input<DropdownLink[]>([]);
  readonly disabled = input(false);

  readonly triggerRef = viewChild.required<ElementRef<HTMLElement>>('trigger');
  readonly dropdownTemplate = viewChild.required<TemplateRef<unknown>>('dropdownTemplate');

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

    inject(DestroyRef).onDestroy(() => this.destroyOverlay());
  }

  linkId(index: number): string {
    return `${this.controlId}-link-${index}`;
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }

    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled() || this.isOpen()) {
      return;
    }

    this.isOpen.set(true);
    this.focusedIndex.set(this.links().length > 0 ? 0 : -1);

    const trigger = this.triggerRef().nativeElement;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(trigger)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(8)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ]);

    const triggerWidth = trigger.getBoundingClientRect().width;

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'link-card__backdrop',
      width: triggerWidth,
      minWidth: triggerWidth,
      maxWidth: triggerWidth,
    });

    this.overlayRef.attach(new TemplatePortal(this.dropdownTemplate(), this.viewContainerRef));

    // Route overlay key events through `onKeyDown` so roving focus keeps working
    // once DOM focus has moved onto a link inside the overlay.
    this.overlaySubscriptions.push(
      this.overlayRef.backdropClick().subscribe(() => this.close()),
      this.overlayRef.keydownEvents().subscribe((event) => this.onKeyDown(event)),
    );

    if (this.links().length > 0) {
      queueMicrotask(() => this.focusActiveLink());
    }
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    this.destroyOverlay();
    // `preventScroll` avoids a jarring scroll jump when the menu is dismissed by
    // an outside scroll and focus returns to the trigger.
    this.triggerRef().nativeElement.focus({ preventScroll: true });
  }

  private destroyOverlay(): void {
    this.overlaySubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.overlaySubscriptions = [];
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  onLinkClick(): void {
    this.close();
  }

  onKeyDown(event: KeyboardEvent): void {
    const linkCount = this.links().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else if (linkCount > 0) {
          this.focusedIndex.update((index) => Math.min(index + 1, linkCount - 1));
          this.focusActiveLink();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen() && linkCount > 0) {
          this.focusedIndex.update((index) => Math.max(index - 1, 0));
          this.focusActiveLink();
        }
        break;

      case 'Home':
        if (this.isOpen() && linkCount > 0) {
          event.preventDefault();
          this.focusedIndex.set(0);
          this.focusActiveLink();
        }
        break;

      case 'End':
        if (this.isOpen() && linkCount > 0) {
          event.preventDefault();
          this.focusedIndex.set(linkCount - 1);
          this.focusActiveLink();
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else {
          this.activateFocusedLink();
        }
        break;

      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close();
        }
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  private focusActiveLink(): void {
    const index = this.focusedIndex();
    if (index < 0 || !this.overlayRef) {
      return;
    }

    const link = this.overlayRef.overlayElement.querySelector<HTMLElement>(`#${this.linkId(index)}`);
    link?.focus();
  }

  private activateFocusedLink(): void {
    const index = this.focusedIndex();
    if (index < 0 || !this.overlayRef) {
      return;
    }

    const link = this.overlayRef.overlayElement.querySelector<HTMLElement>(`#${this.linkId(index)}`);
    link?.click();
  }
}
