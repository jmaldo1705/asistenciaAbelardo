import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Desregistrar Service Workers antiguos al iniciar
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      console.log('🗑️ Limpiando Service Workers...');
      registrations.forEach((registration) => {
        registration.unregister();
      });
    }
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
