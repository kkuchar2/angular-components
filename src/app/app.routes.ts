import { Routes } from '@angular/router';

import { ComponentsShellComponent } from './layouts/components-shell/components-shell.component';
import { CustomSelectDemoComponent } from './pages/custom-select-demo/custom-select-demo.component';
import { CustomInputDemoComponent } from './pages/custom-input-demo/custom-input-demo.component';
import { DropdownLinkCardDemoComponent } from './pages/dropdown-link-card-demo/dropdown-link-card-demo.component';
import { GenericTableDemoComponent } from './pages/generic-table-demo/generic-table-demo.component';
import { GenericTableTanstackDemoComponent } from './pages/generic-table-tanstack-demo/generic-table-tanstack-demo.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { MultiFilterDemoComponent } from './pages/multi-filter-demo/multi-filter-demo.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomePageComponent,
    title: 'Angular Components',
  },
  {
    path: 'components',
    component: ComponentsShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'generic-table',
        pathMatch: 'full',
      },
      {
        path: 'generic-table',
        component: GenericTableDemoComponent,
        title: 'Generic Table',
      },
      {
        path: 'generic-table-tanstack',
        component: GenericTableTanstackDemoComponent,
        title: 'Generic Table (TanStack)',
      },
      {
        path: 'custom-select',
        component: CustomSelectDemoComponent,
        title: 'Custom Select',
      },
      {
        path: 'custom-input',
        component: CustomInputDemoComponent,
        title: 'Custom Input',
      },
      {
        path: 'multi-filter',
        component: MultiFilterDemoComponent,
        title: 'Multi Filter',
      },
      {
        path: 'dropdown-link-card',
        component: DropdownLinkCardDemoComponent,
        title: 'Dropdown Link Card',
      },
    ],
  },
  // Legacy top-level paths → components shell
  { path: 'generic-table', redirectTo: 'components/generic-table' },
  { path: 'generic-table-tanstack', redirectTo: 'components/generic-table-tanstack' },
  { path: 'custom-select', redirectTo: 'components/custom-select' },
  { path: 'custom-input', redirectTo: 'components/custom-input' },
  { path: 'multi-filter', redirectTo: 'components/multi-filter' },
  { path: 'dropdown-link-card', redirectTo: 'components/dropdown-link-card' },
  {
    path: '**',
    redirectTo: '',
  },
];
