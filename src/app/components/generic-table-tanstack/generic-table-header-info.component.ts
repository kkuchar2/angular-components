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
  template: `
    <span
      class="gt-header-info"
      tabindex="0"
      role="img"
      [attr.aria-label]="ariaLabel()"
      [matTooltip]="description()"
      matTooltipPosition="above"
      (click)="$event.stopPropagation()"
      (pointerdown)="$event.stopPropagation()"
      (keydown.enter)="$event.stopPropagation()"
      (keydown.space)="$event.stopPropagation(); $event.preventDefault()"
    >
      <svg class="gt-header-info__icon" viewBox="0 0 16 16" focusable="false" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.25" />
        <circle cx="8" cy="5" r="1" fill="currentColor" />
        <path
          d="M8 7.25v4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.25"
          stroke-linecap="round"
        />
      </svg>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      vertical-align: middle;
      line-height: 0;
    }

    .gt-header-info {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      margin-inline-start: 4px;
      color: var(--gt-header-info-color, var(--gtt-header-text, currentColor));
      opacity: 0.55;
      border-radius: 50%;
      outline: none;
      transition: opacity 120ms ease;
    }

    .gt-header-info:hover,
    .gt-header-info:focus-visible {
      opacity: 0.9;
    }

    .gt-header-info:focus-visible {
      box-shadow: 0 0 0 2px var(--gt-header-accent, var(--gtt-header-accent, #1565c0));
    }

    .gt-header-info__icon {
      display: block;
      width: 12px;
      height: 12px;
    }
  `,
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
