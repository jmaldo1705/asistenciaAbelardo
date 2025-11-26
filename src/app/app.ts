import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './toast/toast.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  ngOnInit(): void {
    this.loadGoogleMapsScript();
    this.registerServiceWorker();
    this.checkForUpdates();
  }

  private loadGoogleMapsScript(): void {
    // Verificar si el script ya está cargado
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    // Verificar si tenemos la API key
    if (!environment.googleMapsApiKey) {
      console.warn('⚠️ Google Maps API Key no configurada. Las funciones de mapas no estarán disponibles.');
      return;
    }

    // Crear y cargar el script dinámicamente
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,marker&language=es`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('❌ Error al cargar Google Maps API');
    };
    document.head.appendChild(script);
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator && environment.production) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('✅ Service Worker registrado');
          
          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 3600000);

          // Escuchar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  if (confirm('Hay una nueva versión disponible. ¿Desea actualizar ahora?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        },
        (error) => {
          console.error('❌ Error al registrar Service Worker:', error);
        }
      );
    }
  }

  private checkForUpdates(): void {
    // Verificar si hay una versión en localStorage
    const currentVersion = '1.0.1';
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log('🔄 Nueva versión detectada, limpiando cache...');
      // Limpiar cache del navegador
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }
      // Limpiar localStorage excepto el token
      const token = localStorage.getItem('token');
      const usuario = localStorage.getItem('usuario');
      localStorage.clear();
      if (token) localStorage.setItem('token', token);
      if (usuario) localStorage.setItem('usuario', usuario);
    }
    
    localStorage.setItem('app_version', currentVersion);
  }
}
