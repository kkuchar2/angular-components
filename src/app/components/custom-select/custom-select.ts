import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  forwardRef,
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
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { filter, Subscription } from 'rxjs';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export type CustomSelectAppearance = 'default' | 'outlined';

@Component({
  selector: 'app-custom-select',
  imports: [],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
})
export class CustomSelectComponent<T = string | number> implements ControlValueAccessor {
  private static idCounter = 0;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  readonly controlId = `custom-select-${++CustomSelectComponent.idCounter}`;
  readonly listboxId = `${this.controlId}-listbox`;

  readonly options = input<SelectOption<T>[]>([]);
  readonly placeholder = input('Select an option');
  readonly label = input('');
  readonly appearance = input<CustomSelectAppearance>('default');
  readonly disabled = input(false);
  readonly searchable = input(false);
  readonly width = input('100%');
  readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);

  readonly selectionChange = output<SelectOption<T> | null>();

  readonly triggerRef = viewChild.required<ElementRef<HTMLElement>>('trigger');
  readonly dropdownTemplate = viewChild.required<TemplateRef<unknown>>('dropdownTemplate');

  readonly isOpen = signal(false);
  readonly isFocused = signal(false);
  readonly searchQuery = signal('');
  readonly focusedIndex = signal(-1);
  readonly selectedValue = signal<T | null>(null);
  readonly formDisabled = signal(false);

  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly selectedOption = computed(() => {
    const value = this.selectedValue();
    return this.options().find((option) => this.valuesEqual(option.value, value)) ?? null;
  });

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.options();
    }

    return this.options().filter((option) => option.label.toLowerCase().includes(query));
  });

  readonly activeDescendantId = computed(() => {
    const index = this.focusedIndex();
    if (index < 0) {
      return null;
    }

    return this.optionId(index);
  });

  private overlayRef: OverlayRef | null = null;
  private overlaySubscriptions: Subscription[] = [];
  private triggerResizeObserver: ResizeObserver | null = null;
  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

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

  writeValue(value: T | null): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  optionId(index: number): string {
    return `${this.controlId}-option-${index}`;
  }

  toggle(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.isDisabled() || this.isOpen()) {
      return;
    }

    this.isOpen.set(true);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);

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
      backdropClass: 'custom-select__backdrop',
      width: triggerWidth,
      minWidth: triggerWidth,
      maxWidth: triggerWidth,
    });

    this.overlayRef.attach(new TemplatePortal(this.dropdownTemplate(), this.viewContainerRef));
    this.watchTriggerResize();

    this.overlaySubscriptions.push(
      this.overlayRef.backdropClick().subscribe(() => this.close()),
      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
        }
      }),
    );

    if (this.searchable()) {
      queueMicrotask(() => {
        const searchInput = this.overlayRef?.overlayElement.querySelector<HTMLInputElement>(
          '.custom-select__search-input',
        );
        searchInput?.focus();
      });
    }
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);
    this.destroyOverlay();
    this.onTouched();
    // `preventScroll` avoids a jarring scroll jump when the panel is dismissed by
    // an outside scroll and focus returns to the trigger.
    this.triggerRef().nativeElement.focus({ preventScroll: true });
  }

  private destroyOverlay(): void {
    this.unwatchTriggerResize();
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

  private syncOverlaySize(): void {
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
  }

  selectOption(option: SelectOption<T>): void {
    if (option.disabled) {
      return;
    }

    this.selectedValue.set(option.value);
    this.onChange(option.value);
    this.selectionChange.emit(option);
    this.close();
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedValue.set(null);
    this.onChange(null);
    this.selectionChange.emit(null);
  }

  onSearchInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.searchQuery.set(inputEl.value);
    this.focusedIndex.set(-1);
  }

  onKeyDown(event: KeyboardEvent): void {
    const options = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          if (options.length > 0) {
            this.focusedIndex.set(0);
            queueMicrotask(() => this.scrollActiveOptionIntoView());
          }
        } else {
          this.focusedIndex.update((index) =>
            index < 0 ? 0 : Math.min(index + 1, options.length - 1),
          );
          this.scrollActiveOptionIntoView();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          if (options.length > 0) {
            this.focusedIndex.set(options.length - 1);
            queueMicrotask(() => this.scrollActiveOptionIntoView());
          }
        } else {
          this.focusedIndex.update((index) =>
            index < 0 ? options.length - 1 : Math.max(index - 1, 0),
          );
          this.scrollActiveOptionIntoView();
        }
        break;

      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.focusedIndex.set(options.length > 0 ? 0 : -1);
          this.scrollActiveOptionIntoView();
        }
        break;

      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.focusedIndex.set(options.length > 0 ? options.length - 1 : -1);
          this.scrollActiveOptionIntoView();
        }
        break;

      case 'Enter':
        event.preventDefault();
        this.activateFocusedOption();
        break;

      case ' ':
        // Space activates from the trigger, but must stay typeable in the search field.
        if (event.target instanceof HTMLInputElement) {
          break;
        }
        event.preventDefault();
        this.activateFocusedOption();
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

  isSelected(option: SelectOption<T>): boolean {
    return this.valuesEqual(option.value, this.selectedValue());
  }

  hasValue(): boolean {
    return this.selectedValue() !== null && this.selectedValue() !== undefined;
  }

  isLabelFloated(): boolean {
    if (this.appearance() !== 'outlined') {
      return false;
    }

    return this.isOpen() || this.isFocused() || this.hasValue();
  }

  getDisplayValue(): string {
    const selected = this.selectedOption();
    if (selected) {
      return selected.label;
    }

    if (this.appearance() === 'outlined' && !this.isLabelFloated()) {
      return '';
    }

    return this.placeholder();
  }

  isShowingPlaceholder(): boolean {
    return !this.hasValue() && (this.appearance() !== 'outlined' || this.isLabelFloated());
  }

  onTriggerFocus(): void {
    this.isFocused.set(true);
  }

  onTriggerBlur(): void {
    this.isFocused.set(false);
  }

  private activateFocusedOption(): void {
    if (this.isOpen() && this.focusedIndex() >= 0) {
      const option = this.filteredOptions()[this.focusedIndex()];
      if (option && !option.disabled) {
        this.selectOption(option);
      }
    } else {
      this.open();
    }
  }

  private scrollActiveOptionIntoView(): void {
    const index = this.focusedIndex();
    if (index < 0 || !this.overlayRef) {
      return;
    }

    const option = this.overlayRef.overlayElement.querySelector<HTMLElement>(`#${this.optionId(index)}`);
    option?.scrollIntoView({ block: 'nearest' });
  }

  private valuesEqual(a: T | null, b: T | null): boolean {
    if (a === null || b === null) {
      return a === b;
    }

    return this.compareWith()(a, b);
  }
}
