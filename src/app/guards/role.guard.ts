import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: (roles: string[]) => CanActivateFn = (roles: string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasAnyRole(roles)) {
      return true;
    }

    toastService.show('No tiene permisos para acceder a esta sección', 'error');
    router.navigate(['/coordinadores']);
    return false;
  };
};

// Helper específicos
export const adminGuard: CanActivateFn = roleGuard(['ADMINISTRADOR']);
export const editorGuard: CanActivateFn = roleGuard(['ADMINISTRADOR', 'EDITOR']);
export const visorGuard: CanActivateFn = roleGuard(['ADMINISTRADOR', 'EDITOR', 'VISOR']);
