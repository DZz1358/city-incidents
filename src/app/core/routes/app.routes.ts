import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'incidents-map',
    loadComponent: () =>
      import('../../pages/incidents-list/incidents-list').then((c) => c.IncidentsList),
  },
  {
    path: 'incidents-table',
    loadComponent: () =>
      import('../../pages/incidents-table/incidents-table').then((c) => c.IncidentsTable),
  },
  {
    path: 'incidents/:id',
    loadComponent: () =>
      import('../../pages/incident-details/incident-details').then((c) => c.IncidentDetails),
  },
  {
    path: '',
    redirectTo: '/incidents-table',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/incidents-table',
  },
];
