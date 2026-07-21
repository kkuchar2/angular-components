import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { LucideDynamicIcon, type LucideIconInput } from '@lucide/angular';

export type CustomInputAppearance = 'default' | 'outlined';

@Component({
  selector: 'app-custom-input',
  imports: [LucideDynamicIcon],
  templateUrl: './custom-input.html',
  styleUrl: './custom-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width()',
    '[style.--ci-field-height]': 'height()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true,
    },
  ],
})
export class CustomInputComponent implements ControlValueAccessor {
  private static idCounter = 0;

  readonly controlId = `custom-input-${++CustomInputComponent.idCounter}`;

  readonly label = input('');
  readonly placeholder = input('');
  readonly appearance = input<CustomInputAppearance>('default');
  readonly disabled = input(false);
  readonly type = input<'text' | 'password' | 'email' | 'search' | 'number'>('text');
  readonly clearable = input(false);
  readonly prefixIcon = input<LucideIconInput | undefined>(undefined);
  readonly hint = input('');
  readonly error = input('');
  readonly width = input('100%');
  /** Field height (e.g. `44px`, `2.75rem`). */
  readonly height = input('44px');
  readonly autocomplete = input<string | null>(null);
  readonly spellcheck = input<boolean | null>(null);

  readonly valueChange = output<string>();

  readonly isFocused = signal(false);
  readonly value = signal('');

  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly hintId = `${this.controlId}-hint`;
  readonly errorId = `${this.controlId}-error`;

  readonly describedBy = computed(() => {
    if (this.error()) {
      return this.errorId;
    }

    if (this.hint()) {
      return this.hintId;
    }

    return null;
  });

  private readonly formDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  hasValue(): boolean {
    return this.value().length > 0;
  }

  isLabelFloated(): boolean {
    if (this.appearance() !== 'outlined') {
      return false;
    }

    return this.isFocused() || this.hasValue();
  }

  effectivePlaceholder(): string {
    if (this.appearance() === 'outlined' && !this.isLabelFloated()) {
      return '';
    }

    return this.placeholder();
  }

  onInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.value.set(inputEl.value);
    this.onChange(inputEl.value);
    this.valueChange.emit(inputEl.value);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  clearValue(event: MouseEvent): void {
    event.preventDefault();
    this.value.set('');
    this.onChange('');
    this.valueChange.emit('');
  }
}
