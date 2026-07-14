import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CustomSelectComponent,
  SelectOption,
} from '../../components/custom-select/custom-select';

@Component({
  selector: 'app-custom-select-demo',
  imports: [CustomSelectComponent, FormsModule],
  templateUrl: './custom-select-demo.component.html',
  styleUrl: './custom-select-demo.component.scss',
})
export class CustomSelectDemoComponent {
  readonly basicOptions: SelectOption[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'SolidJS' },
  ];
  readonly basicValue = signal<string | number | null>(null);

  readonly iconOptions: SelectOption[] = [
    { value: 'sun', label: 'Light Mode', icon: '☀️' },
    { value: 'moon', label: 'Dark Mode', icon: '🌙' },
    { value: 'system', label: 'System Default', icon: '💻' },
  ];
  readonly themeValue = signal<string | number | null>('system');

  readonly countryOptions: SelectOption[] = [
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
  readonly countryValue = signal<string | number | null>(null);

  readonly planOptions: SelectOption[] = [
    { value: 'free', label: 'Free Plan' },
    { value: 'pro', label: 'Pro Plan' },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ];
  readonly planValue = signal<string | number | null>('free');

  readonly eventLog = signal<string[]>([]);

  onSelectionChange(label: string, option: SelectOption | null): void {
    const msg = option
      ? `[${label}] Selected: ${option.label}`
      : `[${label}] Cleared`;
    this.eventLog.update((log) => [msg, ...log].slice(0, 8));
  }
}
