import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/cnc/components/cnc-dashboard/cnc-dashboard.component').then(
        (m) => m.CncDashboardComponent
      ),
  },
  {
    path: 'tags',
    loadComponent: () =>
      import('./features/cnc/components/tags-page/tags-page.component').then(
        (m) => m.TagsPageComponent
      ),
  },
];
