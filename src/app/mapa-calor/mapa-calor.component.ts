import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CoordinadorService } from '../services/coordinador.service';
import { ToastService } from '../services/toast.service';
import { Coordinador } from '../models/coordinador.model';

// Declaración de tipos para Google Maps
declare global {
  interface Window {
    google: any;
  }
}

declare var google: any;

interface MarkerData {
  lat: number;
  lng: number;
  count: number;
  ubicacion: string;
}

@Component({
  selector: 'app-mapa-calor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-calor.component.html',
  styleUrl: './mapa-calor.component.css'
})
export class MapaCalorComponent implements OnInit, OnDestroy {
  map: any;
  markers: any[] = [];
  coordinadores: Coordinador[] = [];
  cargando: boolean = true;
  totalDefensores: number = 0;
  ubicacionesUnicas: Map<string, { count: number; lat: number; lng: number }> = new Map();
  geocoder: any;
  mostrarCirculos: boolean = true;

  constructor(
    private coordinadorService: CoordinadorService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Esperar a que Google Maps esté cargado
    this.waitForGoogleMaps().then(() => {
      this.cargarCoordinadores();
    });
  }

  waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      const checkIfLoaded = () => {
        if (typeof window !== 'undefined' && 
            window.google && 
            window.google.maps && 
            window.google.maps.Geocoder && 
            window.google.maps.marker &&
            window.google.maps.marker.AdvancedMarkerElement) {
          resolve();
        } else {
          setTimeout(checkIfLoaded, 100);
        }
      };
      checkIfLoaded();
    });
  }

  ngOnDestroy(): void {
    // Limpiar marcadores
    this.markers.forEach(marker => {
      if (marker.marker) {
        marker.marker.map = null;
      }
      if (marker.circle) {
        marker.circle.setMap(null);
      }
    });
    this.markers = [];
  }

  cargarCoordinadores(): void {
    this.cargando = true;
    this.coordinadorService.obtenerTodos().subscribe({
      next: (data) => {
        this.coordinadores = data;
        this.totalDefensores = data.length;
        this.procesarUbicaciones();
      },
      error: (error) => {
        this.toastService.error('Error al cargar defensores');
        console.error('Error:', error);
        this.cargando = false;
      }
    });
  }

  procesarUbicaciones(): void {
    // Agrupar coordinadores por ubicación
    const ubicacionesAgrupadas = new Map<string, { 
      coordinadoresConCoords: Coordinador[]; 
      coordinadoresSinCoords: Coordinador[];
    }>();
    
    this.coordinadores.forEach(coord => {
      // Usar ciudad si está disponible, si no usar municipio, si no usar "Sin ubicación"
      let clave = '';
      if (coord.ciudad && coord.ciudad.trim()) {
        clave = coord.ciudad;
      } else if (coord.municipio && coord.municipio.trim()) {
        clave = coord.municipio;
      } else {
        clave = 'Sin ubicación';
      }
      
      const existing = ubicacionesAgrupadas.get(clave) || { 
        coordinadoresConCoords: [], 
        coordinadoresSinCoords: [] 
      };
      
      if (coord.latitud && coord.longitud) {
        existing.coordinadoresConCoords.push(coord);
      } else {
        existing.coordinadoresSinCoords.push(coord);
      }
      
      ubicacionesAgrupadas.set(clave, existing);
    });

    // Procesar ubicaciones: usar coordenadas si existen, si no geocodificar
    this.geocoder = new window.google.maps.Geocoder();
    const ubicacionesArray = Array.from(ubicacionesAgrupadas.entries());
    let procesadas = 0;

    if (ubicacionesArray.length === 0) {
      this.cargando = false;
      return;
    }

    ubicacionesArray.forEach(([ubicacion, data]) => {
      const totalCount = data.coordinadoresConCoords.length + data.coordinadoresSinCoords.length;
      
      // Si hay coordinadores con coordenadas, usar el promedio de sus coordenadas
      if (data.coordinadoresConCoords.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        data.coordinadoresConCoords.forEach(coord => {
          sumLat += coord.latitud!;
          sumLng += coord.longitud!;
        });
        const avgLat = sumLat / data.coordinadoresConCoords.length;
        const avgLng = sumLng / data.coordinadoresConCoords.length;
        
        this.ubicacionesUnicas.set(ubicacion, {
          count: totalCount,
          lat: avgLat,
          lng: avgLng
        });
        
        procesadas++;
        if (procesadas === ubicacionesArray.length) {
          this.inicializarMapa();
        }
      } else {
        // No hay coordenadas, geocodificar por nombre
        this.geocodificarUbicacion(ubicacion, totalCount, () => {
          procesadas++;
          if (procesadas === ubicacionesArray.length) {
            this.inicializarMapa();
          }
        });
      }
    });
  }

  geocodificarUbicacion(ubicacion: string, count: number, callback: () => void): void {
    // Si es "Sin ubicación", no geocodificar
    if (ubicacion === 'Sin ubicación') {
      callback();
      return;
    }
    
    const direccion = `${ubicacion}, Colombia`;
    
    this.geocoder.geocode({ address: direccion }, (results: any, status: any) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        this.ubicacionesUnicas.set(ubicacion, {
          count: count,
          lat: location.lat(),
          lng: location.lng()
        });
      } else {
        console.warn(`No se pudo geocodificar: ${ubicacion}`, status);
      }
      callback();
    });
  }

  inicializarMapa(): void {
    if (this.ubicacionesUnicas.size === 0) {
      this.cargando = false;
      this.toastService.warning('No hay ubicaciones para mostrar');
      return;
    }

    // Calcular el centro del mapa basado en las ubicaciones
    const bounds = new window.google.maps.LatLngBounds();

    this.ubicacionesUnicas.forEach((data) => {
      const latLng = new window.google.maps.LatLng(data.lat, data.lng);
      bounds.extend(latLng);
    });

    // Crear el mapa centrado en Colombia
    const mapOptions = {
      zoom: 6,
      center: { lat: 4.570868, lng: -74.297333 }, // Centro de Colombia
      mapId: 'ASISTENCIA_MAP_ID', // Requerido para AdvancedMarkerElement
      styles: [
        {
          featureType: 'all',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    };

    this.map = new window.google.maps.Map(
      document.getElementById('mapa-calor'),
      mapOptions
    );

    // Ajustar el zoom para mostrar todas las ubicaciones
    this.map.fitBounds(bounds);

    // Encontrar el máximo de defensores para normalizar los tamaños
    const maxCount = Math.max(...Array.from(this.ubicacionesUnicas.values()).map(d => d.count));

    // Agregar marcadores avanzados con círculos de calor
    this.ubicacionesUnicas.forEach((data, ubicacion) => {
      const position = { lat: data.lat, lng: data.lng };
      
      // Calcular tamaño y color basado en el número de defensores
      const normalizedCount = data.count / maxCount;
      const radius = Math.max(5000, Math.min(50000, data.count * 3000)); // Radio en metros
      const opacity = Math.max(0.2, Math.min(0.6, normalizedCount));
      
      // Determinar color basado en la densidad
      let fillColor = '#3b82f6'; // Azul para pocos
      if (normalizedCount > 0.7) {
        fillColor = '#ef4444'; // Rojo para muchos
      } else if (normalizedCount > 0.4) {
        fillColor = '#f59e0b'; // Naranja para moderados
      }

      // Crear círculo de calor (simula heatmap)
      const circle = new window.google.maps.Circle({
        strokeColor: fillColor,
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: fillColor,
        fillOpacity: opacity,
        map: this.mostrarCirculos ? this.map : null,
        center: position,
        radius: radius
      });

      // Crear marcador avanzado
      const markerElement = document.createElement('div');
      markerElement.style.width = `${Math.max(20, Math.min(50, 20 + normalizedCount * 30))}px`;
      markerElement.style.height = `${Math.max(20, Math.min(50, 20 + normalizedCount * 30))}px`;
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = fillColor;
      markerElement.style.border = '3px solid white';
      markerElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      markerElement.style.display = 'flex';
      markerElement.style.alignItems = 'center';
      markerElement.style.justifyContent = 'center';
      markerElement.style.color = 'white';
      markerElement.style.fontWeight = 'bold';
      markerElement.style.fontSize = '12px';
      markerElement.textContent = data.count.toString();
      markerElement.title = `${ubicacion}: ${data.count} defensor${data.count > 1 ? 'es' : ''}`;

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: position,
        content: markerElement,
        title: `${ubicacion}: ${data.count} defensor${data.count > 1 ? 'es' : ''}`
      });

      // Info window con detalles
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: #003893;">${ubicacion}</h3>
            <p style="margin: 0; font-size: 14px;">
              <strong>Defensores registrados:</strong> ${data.count}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open({
          anchor: marker,
          map: this.map
        });
      });

      this.markers.push({ marker, circle, ubicacion, count: data.count });
    });

    this.cargando = false;
  }

  volver(): void {
    this.router.navigate(['/coordinadores']);
  }

  toggleHeatmap(): void {
    this.mostrarCirculos = !this.mostrarCirculos;
    this.markers.forEach(markerData => {
      if (markerData.circle) {
        markerData.circle.setMap(this.mostrarCirculos ? this.map : null);
      }
    });
  }

  cambiarGradiente(): void {
    // Función deshabilitada - los colores se calculan automáticamente
    this.toastService.info('Los colores se ajustan automáticamente según la densidad de defensores');
  }

  cambiarRadio(): void {
    // Función deshabilitada - el radio se calcula automáticamente
    this.toastService.info('El tamaño de los círculos se ajusta automáticamente según el número de defensores');
  }
}

