import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hoy' },
  { path: 'hoy', loadComponent: () => import('./today/today.page').then((m) => m.TodayPage) },
  { path: 'ajustes', loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage) },
];
