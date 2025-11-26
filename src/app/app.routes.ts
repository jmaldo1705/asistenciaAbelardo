import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard, visorGuard } from './guards/role.guard';

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
    canActivate: [authGuard, visorGuard]
  },
  {
    path: 'mapa-calor',
    loadComponent: () => import('./mapa-calor/mapa-calor.component').then(m => m.MapaCalorComponent),
    canActivate: [authGuard, visorGuard]
  },
  {
    path: 'eventos',
    loadComponent: () => import('./eventos/eventos.component').then(m => m.EventosComponent),
    canActivate: [authGuard, visorGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'auditoria',
    loadComponent: () => import('./auditoria/auditoria.component').then(m => m.AuditoriaComponent),
    canActivate: [authGuard, adminGuard]
  }
];
