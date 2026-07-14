import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  HostBinding,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { LucideDynamicIcon, type LucideIconInput } from '@lucide/angular';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './custom-input.html',
  styleUrl: './custom-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true,
    },
  ],
})
export class CustomInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() type: 'text' | 'password' | 'email' | 'search' | 'number' = 'text';
  @Input() clearable = false;
  @Input() prefixIcon?: LucideIconInput;
  @Input() hint = '';
  @Input() error = '';
  @Input() width = '100%';

  @Output() valueChange = new EventEmitter<string>();

  @HostBinding('style.width')
  get hostWidth(): string {
    return this.width;
  }

  isFocused = signal(false);

  private value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** ControlValueAccessor */
  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  getValue(): string {
    return this.value;
  }

  hasValue(): boolean {
    return this.value.length > 0;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
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
    this.value = '';
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }
}
