import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MultiFilterComponent,
  createEmptyFilterRule,
  type MultiFilterField,
  type MultiFilterRule,
} from '../../components/multi-filter';

@Component({
  selector: 'app-multi-filter-demo',
  imports: [MultiFilterComponent, FormsModule],
  templateUrl: './multi-filter-demo.component.html',
  styleUrl: './multi-filter-demo.component.scss',
})
export class MultiFilterDemoComponent {
  readonly employeeFields: MultiFilterField[] = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'department', label: 'Department' },
    { value: 'role', label: 'Role' },
    { value: 'status', label: 'Status' },
  ];

  readonly productFields: MultiFilterField[] = [
    { value: 'sku', label: 'SKU' },
    { value: 'title', label: 'Title' },
    { value: 'category', label: 'Category' },
    { value: 'vendor', label: 'Vendor' },
  ];

  readonly interactiveFilters = signal<MultiFilterRule[]>([]);

  readonly seededFilters = signal<MultiFilterRule[]>([
    createEmptyFilterRule({
      field: 'department',
      operator: 'equals',
      value: 'Engineering',
    }),
    createEmptyFilterRule({
      field: 'role',
      operator: 'contains',
      value: 'Senior',
    }),
    createEmptyFilterRule({
      field: 'status',
      operator: 'notEquals',
      value: 'archived',
    }),
    createEmptyFilterRule({
      field: 'email',
      operator: 'contains',
      value: '@example.com',
    }),
    createEmptyFilterRule({
      field: 'name',
      operator: 'notContains',
      value: 'test',
    }),
  ]);

  readonly productFilters = signal<MultiFilterRule[]>([
    createEmptyFilterRule({
      field: 'title',
      operator: 'contains',
      value: 'ceramic',
    }),
  ]);

  readonly disabledFilters = signal<MultiFilterRule[]>([
    createEmptyFilterRule({
      field: 'status',
      operator: 'notEquals',
      value: 'archived',
    }),
  ]);

  readonly operatorLabels: Record<string, string> = {
    equals: 'equals',
    notEquals: 'not equals',
    contains: 'contains',
    notContains: 'not contains',
  };

  readonly eventLog = signal<string[]>([]);

  readonly activeRuleCount = computed(
    () => this.interactiveFilters().filter((rule) => rule.field && rule.operator).length,
  );

  readonly interactiveSummary = computed(() =>
    this.interactiveFilters()
      .filter((rule) => rule.field && rule.operator)
      .map((rule) => this.formatRule(rule))
      .join(' AND ') || 'None',
  );

  onFiltersChange(label: string, rules: MultiFilterRule[]): void {
    const summary =
      rules.length === 0
        ? 'cleared all filters'
        : `${rules.length} rule${rules.length === 1 ? '' : 's'}`;
    this.eventLog.update((log) => [`[${label}] ${summary}`, ...log].slice(0, 8));
  }

  private formatRule(rule: MultiFilterRule): string {
    const field =
      this.employeeFields.find((item) => item.value === rule.field)?.label ?? rule.field;
    const operator = rule.operator ? this.operatorLabels[rule.operator] : '?';
    const value = rule.value.trim() ? `"${rule.value}"` : '(empty)';
    return `${field} ${operator} ${value}`;
  }
}
