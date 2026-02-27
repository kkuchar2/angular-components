import {
  Component,
  Input,
  ElementRef,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownLink {
  label: string;
  url: string;
  icon?: string;
  description?: string;
}

@Component({
  selector: 'app-dropdown-link-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-link-card.html',
  styleUrl: './dropdown-link-card.scss',
})
export class DropdownLinkCardComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() links: DropdownLink[] = [];
  @Input() disabled = false;

  isOpen = signal(false);
  focusedIndex = signal(-1);

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled) return;
    this.isOpen.set(true);
    this.focusedIndex.set(-1);
  }

  close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  openLink(link: DropdownLink): void {
    window.open(link.url, '_blank', 'noopener,noreferrer');
    this.close();
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else {
          this.focusedIndex.update((i) =>
            Math.min(i + 1, this.links.length - 1)
          );
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.max(i - 1, 0));
        break;

      case 'Enter':
        event.preventDefault();
        if (this.isOpen() && this.focusedIndex() >= 0) {
          this.openLink(this.links[this.focusedIndex()]);
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
}
