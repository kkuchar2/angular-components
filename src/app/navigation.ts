export interface ComponentNavItem {
  path: string;
  label: string;
  description: string;
}

export const COMPONENT_NAV_ITEMS: ComponentNavItem[] = [
  {
    path: 'generic-table',
    label: 'Generic Table',
    description: 'Sortable, paginated data table with custom cells',
  },
  {
    path: 'custom-select',
    label: 'Custom Select',
    description: 'Accessible dropdown with search and icons',
  },
  {
    path: 'custom-input',
    label: 'Custom Input',
    description: 'Styled text fields with labels and validation',
  },
  {
    path: 'multi-filter',
    label: 'Multi Filter',
    description: 'Composable field, operator, and value filter rows',
  },
  {
    path: 'dropdown-link-card',
    label: 'Dropdown Link Card',
    description: 'Card with expandable external links',
  },
];
