export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains';

export interface MultiFilterField {
  value: string;
  label: string;
}

export interface MultiFilterRule {
  id: string;
  field: string | null;
  operator: FilterOperator | null;
  value: string;
}

export type MultiFilterAppearance = 'default' | 'outlined';
