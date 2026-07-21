import { Routes } from '@angular/router';

import { CustomSelectDemoComponent } from './pages/custom-select-demo/custom-select-demo.component';
import { CustomInputDemoComponent } from './pages/custom-input-demo/custom-input-demo.component';
import { DropdownLinkCardDemoComponent } from './pages/dropdown-link-card-demo/dropdown-link-card-demo.component';
import { GenericTableDemoComponent } from './pages/generic-table-demo/generic-table-demo.component';
import { MultiFilterDemoComponent } from './pages/multi-filter-demo/multi-filter-demo.component';

export const routes: Routes = [
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
  {
    path: '**',
    redirectTo: 'generic-table',
  },
];
