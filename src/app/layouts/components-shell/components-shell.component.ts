import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon, LucideMoon, LucideSun } from '@lucide/angular';
import { filter, map, startWith } from 'rxjs';

import { COMPONENT_NAV_ITEMS } from '../../navigation';
import { ThemeService } from '../../services/theme.service';

/** Sidebar + topbar shell for the component showcase routes. */
@Component({
  selector: 'app-components-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideDynamicIcon],
  templateUrl: './components-shell.component.html',
  styleUrl: './components-shell.component.scss',
})
export class ComponentsShellComponent {
  protected readonly LucideSun = LucideSun;
  protected readonly LucideMoon = LucideMoon;
  protected readonly navItems = COMPONENT_NAV_ITEMS;
  protected readonly themeService = inject(ThemeService);

  private readonly router = inject(Router);

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.normalizePath(event.urlAfterRedirects)),
      startWith(this.normalizePath(this.router.url)),
    ),
    { initialValue: '' },
  );

  protected readonly activeNavItem = computed(() => {
    return this.navItems.find((item) => item.path === this.currentPath()) ?? null;
  });

  protected readonly pageTitle = computed(() => this.activeNavItem()?.label ?? 'Components');
  protected readonly pageDescription = computed(() => this.activeNavItem()?.description ?? '');

  private normalizePath(url: string): string {
    return url
      .replace(/^\//, '')
      .replace(/^components\/?/, '')
      .split('?')[0];
  }
}
