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
    path: 'coordinadores/:id/invitados',
    loadComponent: () => import('./invitados/invitados.component').then(m => m.InvitadosComponent),
    canActivate: [authGuard]
  }
];
