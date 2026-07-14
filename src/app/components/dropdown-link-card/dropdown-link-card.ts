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
  url?: string;
  icon?: DropdownLinkCardIcon;
  description?: string;
  children?: DropdownLink[];
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
  readonly openSubmenuIndex = signal(-1);
  readonly focusedSubIndex = signal(-1);
  readonly submenuPlacement = signal<'end' | 'start'>('end');
  readonly submenuMode = signal<'flyout' | 'drilldown'>('flyout');
  readonly itemLayouts = signal<Record<number, 'flyout-end' | 'flyout-start' | 'drilldown'>>({});

  private readonly submenuMinWidth = 220;
  private readonly viewportMargin = 8;

  private overlayRef: OverlayRef | null = null;
  private overlaySubscriptions: Subscription[] = [];
  private triggerResizeObserver: ResizeObserver | null = null;
  private resizeFrameId: number | null = null;
  private readonly onWindowResize = (): void => {
    if (this.isOpen()) {
      this.syncOverlaySize();
    }
  };

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

  linkId(index: number, subIndex?: number): string {
    return subIndex === undefined
      ? `${this.controlId}-link-${index}`
      : `${this.controlId}-link-${index}-${subIndex}`;
  }

  hasChildren(link: DropdownLink): boolean {
    return (link.children?.length ?? 0) > 0;
  }

  itemLayout(index: number): 'flyout-end' | 'flyout-start' | 'drilldown' {
    return this.itemLayouts()[index] ?? 'flyout-end';
  }

  opensSubmenuOnLeft(index: number): boolean {
    return this.itemLayout(index) === 'flyout-start';
  }

  isDrilldown(): boolean {
    return this.submenuMode() === 'drilldown' && this.openSubmenuIndex() >= 0;
  }

  drilldownParent(): DropdownLink | null {
    const index = this.openSubmenuIndex();
    return this.isDrilldown() && index >= 0 ? (this.links()[index] ?? null) : null;
  }

  backButtonId(): string {
    return `${this.controlId}-back`;
  }

  goBack(): void {
    const parentIndex = this.openSubmenuIndex();
    this.closeSubmenu();
    this.focusedIndex.set(parentIndex);
    queueMicrotask(() => this.focusActiveLink());
  }

  onParentClick(index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.focusedIndex.set(-1);
    this.focusedSubIndex.set(-1);
    this.openSubmenu(index);
  }

  onItemMouseEnter(index: number): void {
    if (this.hasChildren(this.links()[index])) {
      if (this.itemLayout(index) !== 'drilldown') {
        this.openSubmenu(index);
      } else {
        this.closeSubmenu();
      }
    } else {
      this.closeSubmenu();
    }
  }

  onSubmenuMouseLeave(): void {
    if (this.submenuMode() === 'flyout') {
      this.closeSubmenu();
    }
  }

  private openSubmenu(index: number): void {
    this.openSubmenuIndex.set(index);
    this.resolveSubmenuMode(index);
  }

  private getSubmenuLayout(index: number): 'flyout-end' | 'flyout-start' | 'drilldown' {
    const anchorEl =
      this.overlayRef?.overlayElement.querySelector<HTMLElement>(`#${this.linkId(index)}`) ??
      this.overlayRef?.overlayElement.querySelector<HTMLElement>(`#${this.menuId}`) ??
      this.triggerRef().nativeElement;

    const anchorRect = anchorEl.getBoundingClientRect();
    const spaceRight = window.innerWidth - anchorRect.right - this.viewportMargin;
    const spaceLeft = anchorRect.left - this.viewportMargin;

    if (spaceRight >= this.submenuMinWidth) {
      return 'flyout-end';
    }

    if (spaceLeft >= this.submenuMinWidth) {
      return 'flyout-start';
    }

    return 'drilldown';
  }

  private resolveSubmenuMode(index: number): void {
    if (!this.overlayRef || this.openSubmenuIndex() !== index) {
      return;
    }

    const layout = this.getSubmenuLayout(index);

    if (layout === 'flyout-end') {
      this.submenuMode.set('flyout');
      this.submenuPlacement.set('end');
    } else if (layout === 'flyout-start') {
      this.submenuMode.set('flyout');
      this.submenuPlacement.set('start');
    } else {
      this.submenuMode.set('drilldown');
    }
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
    this.focusedIndex.set(-1);
    this.openSubmenuIndex.set(-1);
    this.focusedSubIndex.set(-1);

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
      panelClass: 'link-card__overlay-pane',
      width: triggerWidth,
      minWidth: triggerWidth,
      maxWidth: triggerWidth,
    });

    this.overlayRef.attach(new TemplatePortal(this.dropdownTemplate(), this.viewContainerRef));
    this.watchTriggerResize();
    this.watchWindowResize();

    // Route overlay key events through `onKeyDown` so roving focus keeps working
    // once DOM focus has moved onto a link inside the overlay.
    this.overlaySubscriptions.push(
      this.overlayRef.backdropClick().subscribe(() => this.close()),
      this.overlayRef.keydownEvents().subscribe((event) => this.onKeyDown(event)),
    );

    queueMicrotask(() => this.updateItemLayouts());
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    this.openSubmenuIndex.set(-1);
    this.focusedSubIndex.set(-1);
    this.itemLayouts.set({});
    this.destroyOverlay();
    // `preventScroll` avoids a jarring scroll jump when the menu is dismissed by
    // an outside scroll and focus returns to the trigger.
    this.triggerRef().nativeElement.focus({ preventScroll: true });
  }

  private destroyOverlay(): void {
    this.cancelPendingResize();
    this.unwatchTriggerResize();
    this.unwatchWindowResize();
    this.overlaySubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.overlaySubscriptions = [];
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  private watchTriggerResize(): void {
    this.unwatchTriggerResize();

    const trigger = this.triggerRef().nativeElement;
    this.triggerResizeObserver = new ResizeObserver(() => {
      if (this.isOpen()) {
        this.syncOverlaySize();
      }
    });
    this.triggerResizeObserver.observe(trigger);
  }

  private unwatchTriggerResize(): void {
    this.triggerResizeObserver?.disconnect();
    this.triggerResizeObserver = null;
  }

  private watchWindowResize(): void {
    window.addEventListener('resize', this.onWindowResize, { passive: true });
  }

  private unwatchWindowResize(): void {
    window.removeEventListener('resize', this.onWindowResize);
  }

  private syncOverlaySize(): void {
    if (this.resizeFrameId !== null) {
      cancelAnimationFrame(this.resizeFrameId);
    }

    this.resizeFrameId = requestAnimationFrame(() => {
      this.resizeFrameId = null;
      this.applyOverlaySize();
    });
  }

  private cancelPendingResize(): void {
    if (this.resizeFrameId !== null) {
      cancelAnimationFrame(this.resizeFrameId);
      this.resizeFrameId = null;
    }
  }

  private applyOverlaySize(): void {
    if (!this.overlayRef) {
      return;
    }

    const triggerWidth = this.triggerRef().nativeElement.getBoundingClientRect().width;
    this.overlayRef.updateSize({
      width: triggerWidth,
      minWidth: triggerWidth,
      maxWidth: triggerWidth,
    });
    this.overlayRef.updatePosition();

    const submenuIndex = this.openSubmenuIndex();
    if (submenuIndex >= 0) {
      this.resolveSubmenuMode(submenuIndex);
    }

    this.updateItemLayouts();

    if (!this.isDrilldown()) {
      queueMicrotask(() => this.updateItemLayouts());
    }
  }

  onLinkClick(): void {
    this.close();
  }

  onKeyDown(event: KeyboardEvent): void {
    const links = this.links();
    const linkCount = links.length;
    const drilldown = this.isDrilldown();
    const submenuIndex = this.openSubmenuIndex();
    const flyoutOpen = this.submenuMode() === 'flyout' && submenuIndex >= 0;
    const flyoutSubmenu = flyoutOpen && this.focusedSubIndex() >= 0;
    const submenuCount = submenuIndex >= 0 ? (links[submenuIndex]?.children?.length ?? 0) : 0;
    const inSubmenu = drilldown || flyoutSubmenu;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          if (linkCount > 0) {
            this.focusedIndex.set(0);
            queueMicrotask(() => this.focusActiveLink());
          }
        } else if (drilldown && submenuCount > 0) {
          this.focusedSubIndex.update((index) => Math.min(index + 1, submenuCount - 1));
          this.focusActiveLink();
        } else if (flyoutSubmenu && submenuCount > 0) {
          this.focusedSubIndex.update((index) => Math.min(index + 1, submenuCount - 1));
          this.focusActiveLink();
        } else if (linkCount > 0) {
          this.focusedIndex.update((index) =>
            index < 0 ? 0 : Math.min(index + 1, linkCount - 1),
          );
          this.closeSubmenu();
          this.focusActiveLink();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          if (linkCount > 0) {
            this.focusedIndex.set(linkCount - 1);
            queueMicrotask(() => this.focusActiveLink());
          }
        } else if (drilldown) {
          this.focusedSubIndex.update((index) => Math.max(index - 1, -1));
          this.focusActiveLink();
        } else if (flyoutSubmenu && submenuCount > 0) {
          this.focusedSubIndex.update((index) => Math.max(index - 1, 0));
          this.focusActiveLink();
        } else if (linkCount > 0) {
          this.focusedIndex.update((index) =>
            index < 0 ? linkCount - 1 : Math.max(index - 1, 0),
          );
          this.closeSubmenu();
          this.focusActiveLink();
        }
        break;

      case 'ArrowRight':
        if (this.isOpen() && !inSubmenu) {
          const index = this.focusedIndex();
          if (index >= 0 && this.hasChildren(links[index])) {
            const layout = this.itemLayout(index);
            if (layout === 'flyout-end' || layout === 'drilldown') {
              event.preventDefault();
              this.openSubmenuViaKeyboard(index);
            }
          }
        } else if (this.isOpen() && flyoutOpen && this.submenuPlacement() === 'start') {
          event.preventDefault();
          this.closeFlyoutSubmenu();
        }
        break;

      case 'ArrowLeft':
        if (this.isOpen() && !inSubmenu && !flyoutOpen) {
          const index = this.focusedIndex();
          if (index >= 0 && this.hasChildren(links[index]) && this.itemLayout(index) === 'flyout-start') {
            event.preventDefault();
            this.openSubmenuViaKeyboard(index);
          }
        } else if (this.isOpen() && drilldown) {
          event.preventDefault();
          this.goBack();
        } else if (this.isOpen() && flyoutOpen && this.submenuPlacement() === 'end') {
          event.preventDefault();
          this.closeFlyoutSubmenu();
        }
        break;

      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          if (drilldown) {
            this.focusedSubIndex.set(-1);
          } else if (flyoutSubmenu && submenuCount > 0) {
            this.focusedSubIndex.set(0);
          } else if (linkCount > 0) {
            this.focusedIndex.set(0);
            this.closeSubmenu();
          }
          this.focusActiveLink();
        }
        break;

      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          if ((drilldown || flyoutSubmenu) && submenuCount > 0) {
            this.focusedSubIndex.set(submenuCount - 1);
          } else if (linkCount > 0) {
            this.focusedIndex.set(linkCount - 1);
            this.closeSubmenu();
          }
          this.focusActiveLink();
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else if (drilldown && this.focusedSubIndex() === -1) {
          this.goBack();
        } else if (inSubmenu && this.focusedSubIndex() >= 0) {
          this.activateFocusedLink();
        } else {
          const index = this.focusedIndex();
          if (index >= 0 && this.hasChildren(links[index])) {
            this.openSubmenuViaKeyboard(index);
          } else {
            this.activateFocusedLink();
          }
        }
        break;

      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          if (inSubmenu) {
            if (drilldown) {
              this.goBack();
            } else {
              this.closeFlyoutSubmenu();
            }
          } else {
            this.close();
          }
        }
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  private updateItemLayouts(): void {
    if (!this.overlayRef) {
      return;
    }

    const layouts: Record<number, 'flyout-end' | 'flyout-start' | 'drilldown'> = {};
    this.links().forEach((link, index) => {
      if (this.hasChildren(link)) {
        layouts[index] = this.getSubmenuLayout(index);
      }
    });
    this.itemLayouts.set(layouts);
  }

  private openSubmenuViaKeyboard(index: number): void {
    this.openSubmenu(index);
    queueMicrotask(() => {
      if (this.openSubmenuIndex() !== index) {
        return;
      }
      this.focusedSubIndex.set(this.isDrilldown() ? -1 : 0);
      this.focusActiveLink();
    });
  }

  private closeFlyoutSubmenu(): void {
    this.closeSubmenu();
    this.focusActiveLink();
  }

  private closeSubmenu(): void {
    this.openSubmenuIndex.set(-1);
    this.focusedSubIndex.set(-1);
    this.submenuPlacement.set('end');
    this.submenuMode.set('flyout');
  }

  private focusActiveLink(): void {
    if (!this.overlayRef) {
      return;
    }

    if (this.isDrilldown()) {
      if (this.focusedSubIndex() === -1) {
        this.overlayRef.overlayElement.querySelector<HTMLElement>(`#${this.backButtonId()}`)?.focus();
        return;
      }

      const parentIndex = this.openSubmenuIndex();
      const selector = `#${this.linkId(parentIndex, this.focusedSubIndex())}`;
      this.overlayRef.overlayElement.querySelector<HTMLElement>(selector)?.focus();
      return;
    }

    const subIndex = this.focusedSubIndex();
    const parentIndex = subIndex >= 0 ? this.openSubmenuIndex() : this.focusedIndex();
    if (parentIndex < 0) {
      return;
    }

    const selector = `#${this.linkId(parentIndex, subIndex >= 0 ? subIndex : undefined)}`;
    this.overlayRef.overlayElement.querySelector<HTMLElement>(selector)?.focus();
  }

  private activateFocusedLink(): void {
    if (!this.overlayRef) {
      return;
    }

    const subIndex = this.focusedSubIndex();
    const parentIndex = subIndex >= 0 ? this.openSubmenuIndex() : this.focusedIndex();
    if (parentIndex < 0) {
      return;
    }

    const selector = `#${this.linkId(parentIndex, subIndex >= 0 ? subIndex : undefined)}`;
    const link = this.overlayRef.overlayElement.querySelector<HTMLElement>(selector);
    link?.click();
  }
}
