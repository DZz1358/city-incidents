import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'incidents',
    loadComponent: () =>
      import('./pages/incidents-list/incidents-list').then(c => c.IncidentsList),
  },
  {
    path: 'incidents/:id',
    loadComponent: () =>
      import('./pages/incident-details/incident-details').then(c => c.IncidentDetails),
  },
  {
    path: '',
    redirectTo: '/incidents',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/incidents',
  },
];
