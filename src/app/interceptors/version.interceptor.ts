import { HttpInterceptorFn } from '@angular/common/http';

// Versión de la aplicación - incrementar cada vez que se haga deploy
const APP_VERSION = '1.0.1';

export const versionInterceptor: HttpInterceptorFn = (req, next) => {
  // Agregar header de versión y cache-control
  const clonedRequest = req.clone({
    setHeaders: {
      'X-App-Version': APP_VERSION,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  return next(clonedRequest);
};
