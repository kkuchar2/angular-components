import type { LucideIconInput } from '@lucide/angular';

/** `'actions'` = item list; `'details'` = larger read-only detail panel. */
export type ContextMenuVariant = 'actions' | 'details';

/** Single item shown in the actions variant of {@link ContextMenuComponent}. */
export interface ContextMenuItem {
  /** Stable id emitted via `(itemSelect)`. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional Lucide icon rendered before the label. */
  icon?: LucideIconInput;
  /** When true the item is non-interactive. */
  disabled?: boolean;
  /** Danger / destructive styling (e.g. Delete). */
  danger?: boolean;
  /** Render a separator line above this item. */
  dividerBefore?: boolean;
}

/** Label/value row in the details variant of {@link ContextMenuComponent}. */
export interface ContextMenuDetailField {
  /** Field label (muted). */
  label: string;
  /** Field value (primary). */
  value: string;
}
