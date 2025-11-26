import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // No autorizado - redirigir a login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        router.navigate(['/login']);
        toastService.show('Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
      } else if (error.status === 403) {
        // Prohibido - no tiene permisos
        toastService.show('No tiene permisos para realizar esta acción', 'error');
      } else if (error.status === 0) {
        // Error de red
        toastService.show('Error de conexión. Verifique su conexión a internet.', 'error');
      } else if (error.status >= 500) {
        // Error del servidor
        toastService.show('Error del servidor. Por favor intente más tarde.', 'error');
      }

      return throwError(() => error);
    })
  );
};
