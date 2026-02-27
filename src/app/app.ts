import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CustomSelectComponent,
  SelectOption,
} from './components/custom-select/custom-select';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CustomSelectComponent, FormsModule],
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

  // ── Event log ─────────────────────────────────────
  eventLog = signal<string[]>([]);

  onSelectionChange(label: string, option: SelectOption | null): void {
    const msg = option
      ? `[${label}] Selected: ${option.label}`
      : `[${label}] Cleared`;
    this.eventLog.update((log) => [msg, ...log].slice(0, 8));
  }
}
