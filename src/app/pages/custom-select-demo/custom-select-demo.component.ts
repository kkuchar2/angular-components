import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CustomSelectComponent,
  SelectOption,
} from '../../components/custom-select/custom-select';
import { DemoCodeBlockComponent } from '../../shared/demo-code-block/demo-code-block.component';

@Component({
  selector: 'app-custom-select-demo',
  imports: [CustomSelectComponent, FormsModule, DemoCodeBlockComponent],
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

  readonly widthOptions: SelectOption[] = [
    { value: 'xs', label: 'XS' },
    { value: 'small', label: 'Small option' },
    { value: 'medium-length', label: 'A medium-length label' },
    { value: 'very-long', label: 'This is a very long option label that would stretch the trigger' },
  ];
  readonly widthValue = signal<string | number | null>('xs');

  readonly eventLog = signal<string[]>([]);

  readonly snippets = {
    outlined: `<app-custom-select
  appearance="outlined"
  [options]="options"
  placeholder="Choose a framework"
  label="Framework"
  [(ngModel)]="value"
/>`,
    basic: `<app-custom-select
  [options]="options"
  placeholder="Choose a framework"
  label="Framework"
  [(ngModel)]="value"
  (selectionChange)="onSelectionChange($event)"
/>`,
    icons: `// options: { value, label, icon?: string }[]
<app-custom-select
  [options]="iconOptions"
  placeholder="Pick a theme"
  label="Theme"
  [(ngModel)]="value"
/>`,
    searchable: `<app-custom-select
  [options]="countryOptions"
  placeholder="Select a country"
  label="Country"
  [searchable]="true"
  [(ngModel)]="value"
/>`,
    disabledOptions: `// Mark an option with disabled: true
const options = [
  { value: 'free', label: 'Free Plan' },
  { value: 'pro', label: 'Pro Plan' },
  { value: 'enterprise', label: 'Enterprise', disabled: true },
];

<app-custom-select
  [options]="options"
  label="Subscription Plan"
  [(ngModel)]="value"
/>`,
    width: `<app-custom-select
  [options]="options"
  label="Size preset"
  width="14rem"
  [(ngModel)]="value"
/>`,
    height: `<app-custom-select
  [options]="options"
  label="Compact"
  height="36px"
  [(ngModel)]="value"
/>`,
    clearable: `<app-custom-select
  [options]="options"
  label="Framework"
  [clearable]="true"
  [(ngModel)]="value"
/>`,
    disabled: `<app-custom-select
  [options]="options"
  label="Disabled"
  [disabled]="true"
/>`,
  };

  onSelectionChange(label: string, option: SelectOption | null): void {
    const msg = option
      ? `[${label}] Selected: ${option.label}`
      : `[${label}] Cleared`;
    this.eventLog.update((log) => [msg, ...log].slice(0, 8));
  }
}
