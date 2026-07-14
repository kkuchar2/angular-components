import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon, LucideMoon, LucideSun } from '@lucide/angular';
import { filter, map, startWith } from 'rxjs';

import { COMPONENT_NAV_ITEMS } from './navigation';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideDynamicIcon],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly LucideSun = LucideSun;
  protected readonly LucideMoon = LucideMoon;
  protected readonly navItems = COMPONENT_NAV_ITEMS;
  protected readonly themeService = inject(ThemeService);

  private readonly router = inject(Router);

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.replace(/^\//, '').split('?')[0]),
      startWith(this.router.url.replace(/^\//, '').split('?')[0]),
    ),
    { initialValue: '' },
  );

  protected readonly activeNavItem = computed(() => {
    return this.navItems.find((item) => item.path === this.currentPath()) ?? null;
  });

  protected readonly pageTitle = computed(() => this.activeNavItem()?.label ?? 'Components');
  protected readonly pageDescription = computed(() => this.activeNavItem()?.description ?? '');
}
