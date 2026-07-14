import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideMail, LucideSearch } from '@lucide/angular';

import { CustomInputComponent } from '../../components/custom-input/custom-input';

@Component({
  selector: 'app-custom-input-demo',
  imports: [CustomInputComponent, FormsModule],
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

  onValueChange(label: string, value: string): void {
    const msg = `[${label}] Value: ${value || '(empty)'}`;
    this.eventLog.update((log) => [msg, ...log].slice(0, 8));
  }
}
