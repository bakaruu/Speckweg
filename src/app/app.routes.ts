import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hoy' },
  { path: 'hoy', loadComponent: () => import('./today/today.page').then((m) => m.TodayPage) },
  { path: 'menu', loadComponent: () => import('./menu/menu.page').then((m) => m.MenuPage) },
  { path: 'ajustes', loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage) },
];
