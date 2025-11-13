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
}
