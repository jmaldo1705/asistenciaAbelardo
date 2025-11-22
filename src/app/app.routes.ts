import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'coordinadores',
    loadComponent: () => import('./coordinadores/coordinadores.component').then(m => m.CoordinadoresComponent),
    canActivate: [authGuard]
  },
  {
    path: 'mapa-calor',
    loadComponent: () => import('./mapa-calor/mapa-calor.component').then(m => m.MapaCalorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'eventos',
    loadComponent: () => import('./eventos/eventos.component').then(m => m.EventosComponent),
    canActivate: [authGuard]
  }
];
