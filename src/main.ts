import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Desregistrar Service Workers antiguos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      console.log('🗑️ Desregistrando Service Worker:', registration.scope);
      registration.unregister();
    });
  });

  // Escuchar mensaje de desinstalación del SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UNREGISTERED') {
      console.log('✅ Service Worker desregistrado, recargando página...');
      window.location.reload();
    }
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
