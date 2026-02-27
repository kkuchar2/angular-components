import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  forwardRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select an option';
  @Input() label = '';
  @Input() disabled = false;
  @Input() searchable = false;

  @Output() selectionChange = new EventEmitter<SelectOption | null>();

  isOpen = signal(false);
  searchQuery = signal('');
  focusedIndex = signal(-1);

  private selectedValue: string | number | null = null;

  selectedOption = computed(() => {
    return this.options.find((o) => o.value === this.selectedValue) ?? null;
  });

  filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.options;
    return this.options.filter((o) => o.label.toLowerCase().includes(query));
  });

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  /** ControlValueAccessor */
  writeValue(value: string | number | null): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.disabled) return;
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);
    this.onTouched();
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this.selectedValue = option.value;
    this.onChange(option.value);
    this.selectionChange.emit(option);
    this.close();
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedValue = null;
    this.onChange(null);
    this.selectionChange.emit(null);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.focusedIndex.set(0);
  }

  onKeyDown(event: KeyboardEvent): void {
    const options = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else {
          this.focusedIndex.update((i) => Math.min(i + 1, options.length - 1));
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.max(i - 1, 0));
        break;

      case 'Enter':
        event.preventDefault();
        if (this.isOpen() && this.focusedIndex() >= 0) {
          const opt = options[this.focusedIndex()];
          if (opt && !opt.disabled) {
            this.selectOption(opt);
          }
        } else {
          this.open();
        }
        break;

      case 'Escape':
        this.close();
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  isSelected(option: SelectOption): boolean {
    return this.selectedValue === option.value;
  }

  getSelectedLabel(): string {
    const opt = this.options.find((o) => o.value === this.selectedValue);
    return opt ? opt.label : '';
  }

  hasValue(): boolean {
    return this.selectedValue !== null && this.selectedValue !== undefined;
  }
}
