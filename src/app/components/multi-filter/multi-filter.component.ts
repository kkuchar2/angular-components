import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  LucideDynamicIcon,
  LucideEqual,
  LucideEqualNot,
  LucidePlus,
  LucideSearchX,
  LucideTextSearch,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';

import {
  CustomSelectComponent,
  SelectOption,
} from '../custom-select/custom-select';
import { CustomInputComponent } from '../custom-input/custom-input';
import type {
  FilterOperator,
  MultiFilterAppearance,
  MultiFilterField,
  MultiFilterRule,
} from './multi-filter.types';

export type {
  FilterOperator,
  MultiFilterAppearance,
  MultiFilterField,
  MultiFilterRule,
} from './multi-filter.types';

let ruleIdCounter = 0;

function createRuleId(): string {
  return `filter-rule-${++ruleIdCounter}-${Date.now().toString(36)}`;
}

export function createEmptyFilterRule(
  defaults: Partial<Pick<MultiFilterRule, 'field' | 'operator' | 'value'>> = {},
): MultiFilterRule {
  return {
    id: createRuleId(),
    field: defaults.field ?? null,
    operator: defaults.operator ?? 'equals',
    value: defaults.value ?? '',
  };
}

@Component({
  selector: 'app-multi-filter',
  imports: [
    FormsModule,
    CustomSelectComponent,
    CustomInputComponent,
    LucideDynamicIcon,
  ],
  templateUrl: './multi-filter.component.html',
  styleUrl: './multi-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiFilterComponent),
      multi: true,
    },
  ],
})
export class MultiFilterComponent implements ControlValueAccessor {
  readonly fields = input<MultiFilterField[]>([]);
  readonly appearance = input<MultiFilterAppearance>('outlined');
  readonly disabled = input(false);
  readonly ariaLabel = input('Filters');
  readonly fieldPlaceholder = input('Field');
  readonly operatorPlaceholder = input('Operator');
  readonly valuePlaceholder = input('Value…');
  readonly addLabel = input('Add filter');
  readonly clearLabel = input('Clear all');
  readonly emptyMessage = input('No filters yet. Add one to narrow results.');
  /** Max height of the scrollable rules list. Pass `null` or `'none'` to disable. */
  readonly maxHeight = input<string | null>('16rem');

  readonly filtersChange = output<MultiFilterRule[]>();

  readonly LucidePlus = LucidePlus;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  readonly rulesListRef = viewChild<ElementRef<HTMLUListElement>>('rulesList');

  readonly rules = signal<MultiFilterRule[]>([]);
  readonly formDisabled = signal(false);
  readonly activeRuleId = signal<string | null>(null);

  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly fieldOptions = computed<SelectOption<string>[]>(() =>
    this.fields().map((field) => ({
      value: field.value,
      label: field.label,
    })),
  );

  readonly operatorOptions: SelectOption<FilterOperator>[] = [
    { value: 'equals', label: 'Equals', lucideIcon: LucideEqual },
    { value: 'notEquals', label: 'Not equals', lucideIcon: LucideEqualNot },
    { value: 'contains', label: 'Contains', lucideIcon: LucideTextSearch },
    { value: 'notContains', label: 'Not contains', lucideIcon: LucideSearchX },
  ];

  private onChange: (value: MultiFilterRule[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: MultiFilterRule[] | null): void {
    const rules = this.cloneRules(value ?? []);
    this.rules.set(rules);

    const activeId = this.activeRuleId();
    if (activeId && !rules.some((rule) => rule.id === activeId)) {
      this.activeRuleId.set(null);
    }
  }

  registerOnChange(fn: (value: MultiFilterRule[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  addRule(): void {
    if (this.isDisabled()) {
      return;
    }

    const rule = createEmptyFilterRule();
    const next = [...this.rules(), rule];
    this.activeRuleId.set(rule.id);
    this.commit(next);
    this.onTouched();
    this.scrollRulesToBottom();
  }

  removeRule(id: string): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.activeRuleId() === id) {
      this.activeRuleId.set(null);
    }

    const next = this.rules().filter((rule) => rule.id !== id);
    this.commit(next);
    this.onTouched();
  }

  clearAll(): void {
    if (this.isDisabled() || this.rules().length === 0) {
      return;
    }

    this.activeRuleId.set(null);
    this.commit([]);
    this.onTouched();
  }

  isActiveRule(id: string): boolean {
    return this.activeRuleId() === id;
  }

  updateField(id: string, field: string | null): void {
    this.patchRule(id, { field });
  }

  updateOperator(id: string, operator: FilterOperator | null): void {
    this.patchRule(id, { operator });
  }

  updateValue(id: string, value: string): void {
    this.patchRule(id, { value });
  }

  private patchRule(id: string, patch: Partial<MultiFilterRule>): void {
    if (this.isDisabled()) {
      return;
    }

    const next = this.rules().map((rule) =>
      rule.id === id ? { ...rule, ...patch } : rule,
    );
    this.commit(next);
    this.onTouched();
  }

  private commit(next: MultiFilterRule[]): void {
    const cloned = this.cloneRules(next);
    this.rules.set(cloned);
    this.onChange(cloned);
    this.filtersChange.emit(cloned);
  }

  private cloneRules(rules: MultiFilterRule[]): MultiFilterRule[] {
    return rules.map((rule) => ({ ...rule }));
  }

  private scrollRulesToBottom(): void {
    // Wait for the new row to render, then bring it into view.
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        const list = this.rulesListRef()?.nativeElement;
        if (!list) {
          return;
        }

        list.scrollTop = list.scrollHeight;
      });
    });
  }
}
