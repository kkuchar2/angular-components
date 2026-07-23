import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Small circular info affordance for column headers. Shows `description` in a
 * Material tooltip. Stops pointer events so it does not trigger column sort.
 */
@Component({
  selector: 'app-generic-table-header-info',
  imports: [MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './generic-table-header-info.component.html',
  styleUrl: './generic-table-header-info.component.scss',
})
export class GenericTableHeaderInfoComponent {
  /** Tooltip text from `ColumnDef.description`. */
  readonly description = input.required<string>();
  /** Column header label used to build a useful aria-label. */
  readonly label = input('');

  ariaLabel(): string {
    const label = this.label().trim();
    return label ? `About ${label}` : 'Column info';
  }
}
