import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CustomSelectComponent,
  SelectOption,
} from './components/custom-select/custom-select';
import {
  DropdownLinkCardComponent,
  DropdownLink,
} from './components/dropdown-link-card/dropdown-link-card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CustomSelectComponent, DropdownLinkCardComponent, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // ── Basic select ──────────────────────────────────
  basicOptions: SelectOption[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'SolidJS' },
  ];
  basicValue = signal<string | number | null>(null);

  // ── Select with icons ─────────────────────────────
  iconOptions: SelectOption[] = [
    { value: 'sun', label: 'Light Mode', icon: '☀️' },
    { value: 'moon', label: 'Dark Mode', icon: '🌙' },
    { value: 'system', label: 'System Default', icon: '💻' },
  ];
  themeValue = signal<string | number | null>('system');

  // ── Searchable select ─────────────────────────────
  countryOptions: SelectOption[] = [
    { value: 'us', label: 'United States', icon: '🇺🇸' },
    { value: 'uk', label: 'United Kingdom', icon: '🇬🇧' },
    { value: 'de', label: 'Germany', icon: '🇩🇪' },
    { value: 'fr', label: 'France', icon: '🇫🇷' },
    { value: 'jp', label: 'Japan', icon: '🇯🇵' },
    { value: 'kr', label: 'South Korea', icon: '🇰🇷' },
    { value: 'br', label: 'Brazil', icon: '🇧🇷' },
    { value: 'ca', label: 'Canada', icon: '🇨🇦' },
    { value: 'au', label: 'Australia', icon: '🇦🇺' },
    { value: 'in', label: 'India', icon: '🇮🇳' },
  ];
  countryValue = signal<string | number | null>(null);

  // ── Disabled options ──────────────────────────────
  planOptions: SelectOption[] = [
    { value: 'free', label: 'Free Plan' },
    { value: 'pro', label: 'Pro Plan' },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ];
  planValue = signal<string | number | null>('free');
  // ── Dropdown Link Cards ───────────────────────────────
  docsLinks: DropdownLink[] = [
    {
      label: 'Angular Docs',
      url: 'https://angular.dev',
      icon: '📕',
      description: 'Official Angular documentation',
    },
    {
      label: 'TypeScript Handbook',
      url: 'https://www.typescriptlang.org/docs/',
      icon: '📘',
      description: 'Learn TypeScript fundamentals',
    },
    {
      label: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      icon: '🌐',
      description: 'Web APIs & HTML/CSS/JS reference',
    },
    {
      label: 'RxJS Guide',
      url: 'https://rxjs.dev/guide/overview',
      icon: '⚡',
      description: 'Reactive programming with RxJS',
    },
  ];

  socialLinks: DropdownLink[] = [
    { label: 'GitHub', url: 'https://github.com', icon: '🐙' },
    { label: 'Twitter / X', url: 'https://x.com', icon: '🐦' },
    { label: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
    { label: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📚' },
  ];

  toolLinks: DropdownLink[] = [
    {
      label: 'VS Code',
      url: 'https://code.visualstudio.com',
      icon: '🛠️',
      description: 'Code editor',
    },
    {
      label: 'Figma',
      url: 'https://figma.com',
      icon: '🎨',
      description: 'Design tool',
    },
    {
      label: 'Vercel',
      url: 'https://vercel.com',
      icon: '▲',
      description: 'Deploy platform',
    },
  ];
  // ── Event log ─────────────────────────────────────
  eventLog = signal<string[]>([]);

  onSelectionChange(label: string, option: SelectOption | null): void {
    const msg = option
      ? `[${label}] Selected: ${option.label}`
      : `[${label}] Cleared`;
    this.eventLog.update((log) => [msg, ...log].slice(0, 8));
  }
}
