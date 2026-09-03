import type { LucideIconInput } from '@lucide/angular';

export type ContextMenuVariant = 'actions' | 'details';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: LucideIconInput;
  disabled?: boolean;
  danger?: boolean;
  dividerBefore?: boolean;
}

export interface ContextMenuDetailField {
  label: string;
  value: string;
}
