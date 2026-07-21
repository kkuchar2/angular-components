import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideMail, LucideSearch } from '@lucide/angular';

import { CustomInputComponent } from '../../components/custom-input/custom-input';
import { DemoCodeBlockComponent } from '../../shared/demo-code-block/demo-code-block.component';

@Component({
  selector: 'app-custom-input-demo',
  imports: [CustomInputComponent, FormsModule, DemoCodeBlockComponent],
  templateUrl: './custom-input-demo.component.html',
  styleUrl: './custom-input-demo.component.scss',
})
export class CustomInputDemoComponent {
  readonly LucideMail = LucideMail;
  readonly LucideSearch = LucideSearch;

  readonly nameValue = signal('');
  readonly emailValue = signal('');
  readonly searchValue = signal('');
  readonly passwordValue = signal('');
  readonly eventLog = signal<string[]>([]);

  readonly snippets = {
    outlined: `<app-custom-input
  appearance="outlined"
  label="Full name"
  placeholder="Enter your name"
  [(ngModel)]="value"
/>`,
    basic: `<app-custom-input
  label="Full name"
  placeholder="Enter your name"
  [(ngModel)]="value"
  (valueChange)="onValueChange($event)"
/>`,
    emailHint: `import { LucideMail } from '@lucide/angular';

<app-custom-input
  label="Email address"
  type="email"
  placeholder="you@example.com"
  [prefixIcon]="LucideMail"
  hint="We'll never share your email."
  [(ngModel)]="value"
/>`,
    searchClear: `import { LucideSearch } from '@lucide/angular';

<app-custom-input
  label="Search"
  type="search"
  placeholder="Search components..."
  [prefixIcon]="LucideSearch"
  [clearable]="true"
  [(ngModel)]="value"
/>`,
    passwordError: `<app-custom-input
  label="Password"
  type="password"
  placeholder="At least 8 characters"
  [error]="value.length > 0 && value.length < 8
    ? 'Password must be at least 8 characters.'
    : ''"
  [(ngModel)]="value"
/>`,
    width: `<app-custom-input
  label="Project code"
  placeholder="Short code"
  width="10rem"
  hint="Fixed at 10rem wide."
  [clearable]="true"
/>`,
    height: `<app-custom-input
  label="Compact"
  placeholder="36px tall"
  height="36px"
/>`,
    disabled: `<app-custom-input
  label="Read only"
  placeholder="Can't edit"
  [disabled]="true"
/>`,
  };

  onValueChange(label: string, value: string): void {
    const msg = `[${label}] Value: ${value || '(empty)'}`;
    this.eventLog.update((log) => [msg, ...log].slice(0, 8));
  }
}
