import { Directive, ElementRef, inject, OnDestroy, output, signal } from '@angular/core';

/** Reports the observed element's content-box size (rounded px). */
export interface ObservedSize {
  width: number;
  height: number;
}

/**
 * Watches an element with `ResizeObserver` and exposes its size as a signal.
 * Used by the height-playground cards to show live container dimensions.
 */
@Directive({
  selector: '[appResizeObserver]',
  exportAs: 'appResizeObserver',
})
export class ResizeObserverDirective implements OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly observer = new ResizeObserver((entries) => {
    const entry = entries[0];

    if (!entry) {
      return;
    }

    const { width, height } = entry.contentRect;
    const next: ObservedSize = {
      width: Math.round(width),
      height: Math.round(height),
    };

    this.size.set(next);
    this.sizeChange.emit(next);
  });

  readonly size = signal<ObservedSize | null>(null);
  readonly sizeChange = output<ObservedSize>();

  constructor() {
    this.observer.observe(this.element);
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
  }
}
