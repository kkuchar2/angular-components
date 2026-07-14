import type { LucideIconInput } from '@lucide/angular';

export interface DropdownLinkCardIconImage {
  type: 'image';
  src: string;
  alt?: string;
}

export interface DropdownLinkCardIconLucide {
  type: 'lucide';
  icon: LucideIconInput;
}

export type DropdownLinkCardIcon =
  | DropdownLinkCardIconImage
  | DropdownLinkCardIconLucide;
