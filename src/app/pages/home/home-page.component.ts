import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideArrowRight, LucideMoon, LucideSun } from '@lucide/angular';

import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  protected readonly LucideSun = LucideSun;
  protected readonly LucideMoon = LucideMoon;
  protected readonly LucideArrowRight = LucideArrowRight;
  protected readonly themeService = inject(ThemeService);
}
