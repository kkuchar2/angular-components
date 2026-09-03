import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-generic-table-header-info',
  imports: [MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './generic-table-header-info.component.html',
  styleUrl: './generic-table-header-info.component.scss',
})
export class GenericTableHeaderInfoComponent {

  readonly description = input.required<string>();

  readonly label = input('');

  ariaLabel(): string {
    const label = this.label().trim();
    return label ? `About ${label}` : 'Column info';
  }
}
