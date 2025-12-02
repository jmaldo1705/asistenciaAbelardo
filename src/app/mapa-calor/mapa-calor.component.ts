import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoordinadorService } from '../services/coordinador.service';
import { EventoService } from '../services/evento.service';
import { ToastService } from '../services/toast.service';
import { Coordinador } from '../models/coordinador.model';
import { Evento } from '../models/evento.model';

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
  imports: [CommonModule, FormsModule],
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
  eventos: Evento[] = [];
  eventoSeleccionadoId: number | null = null;
  todosLosCoordinadores: Coordinador[] = [];
  
  // Filtros por ubicación
  tipoFiltroUbicacion: 'municipio' | 'sector' = 'municipio';
  municipiosUnicos: string[] = [];
  sectoresUnicos: { sector: string; municipio: string; lat?: number; lng?: number }[] = [];
  municipioSeleccionado: string | null = null;
  sectorSeleccionado: string | null = null;

  constructor(
    private coordinadorService: CoordinadorService,
    private eventoService: EventoService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Cargar eventos primero
    this.cargarEventos();
    
    // Esperar a que Google Maps esté cargado
    this.waitForGoogleMaps().then(() => {
      this.cargarCoordinadores();
    });
  }

  cargarEventos(): void {
    this.eventoService.obtenerTodos().subscribe({
      next: (data) => {
        this.eventos = data;
      },
      error: (error) => {
        console.error('Error al cargar eventos:', error);
      }
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
        this.todosLosCoordinadores = data;
        this.extraerUbicacionesUnicas();
        this.aplicarFiltros();
      },
      error: (error) => {
        this.toastService.error('Error al cargar defensores');
        console.error('Error:', error);
        this.cargando = false;
      }
    });
  }

  // Extraer municipios y sectores únicos para los filtros
  extraerUbicacionesUnicas(): void {
    const municipiosSet = new Set<string>();
    const sectoresMap = new Map<string, { sector: string; municipio: string; lat?: number; lng?: number }>();

    this.todosLosCoordinadores.forEach(coord => {
      // Agregar municipio
      if (coord.municipio && coord.municipio.trim()) {
        municipiosSet.add(coord.municipio.trim());
      }

      // Agregar sector si tiene coordenadas (para poder ubicarlo en el mapa)
      if (coord.sector && coord.sector.trim() && coord.latitud && coord.longitud) {
        const sectorKey = `${coord.sector.trim()}|${coord.municipio?.trim() || ''}`;
        if (!sectoresMap.has(sectorKey)) {
          sectoresMap.set(sectorKey, {
            sector: coord.sector.trim(),
            municipio: coord.municipio?.trim() || '',
            lat: coord.latitud,
            lng: coord.longitud
          });
        }
      }
    });

    this.municipiosUnicos = Array.from(municipiosSet).sort();
    this.sectoresUnicos = Array.from(sectoresMap.values()).sort((a, b) => 
      `${a.municipio} - ${a.sector}`.localeCompare(`${b.municipio} - ${b.sector}`)
    );

    console.log(`📊 Municipios únicos: ${this.municipiosUnicos.length}, Sectores con coordenadas: ${this.sectoresUnicos.length}`);
  }

  // Cambiar tipo de filtro de ubicación
  cambiarTipoFiltroUbicacion(): void {
    this.municipioSeleccionado = null;
    this.sectorSeleccionado = null;
    this.aplicarFiltros();
  }

  // Filtrar por municipio seleccionado
  filtrarPorMunicipio(): void {
    this.aplicarFiltros();
  }

  // Filtrar por sector seleccionado
  filtrarPorSector(): void {
    this.aplicarFiltros();
  }

  procesarUbicaciones(): void {
    // Agrupar coordinadores por ubicación
    const ubicacionesAgrupadas = new Map<string, {
      coordinadoresConCoords: Coordinador[];
      coordinadoresSinCoords: Coordinador[];
    }>();

    console.log(`📊 Procesando ${this.coordinadores.length} coordinadores para el mapa de calor`);
    console.log(`📍 Tipo de filtro: ${this.tipoFiltroUbicacion}`);

    this.coordinadores.forEach(coord => {
      let clave = '';
      let usarCoordenadas = false;
      
      // Si estamos filtrando por sector, agrupar por sector
      if (this.tipoFiltroUbicacion === 'sector' && this.sectorSeleccionado) {
        // Agrupar por sector específico
        if (coord.sector && coord.sector.trim() && coord.latitud && coord.longitud) {
          clave = `${coord.sector}, ${coord.municipio || ''}`;
          usarCoordenadas = true;
        } else if (coord.sector && coord.sector.trim()) {
          clave = `${coord.sector}, ${coord.municipio || ''}`;
          usarCoordenadas = false;
        } else {
          clave = coord.municipio || 'Sin ubicación';
          usarCoordenadas = !!(coord.latitud && coord.longitud);
        }
      } else {
        // Agrupar por municipio (comportamiento original)
        if (coord.municipio && coord.municipio.trim() && coord.latitud && coord.longitud) {
          clave = coord.municipio;
          usarCoordenadas = true;
        } else if (coord.municipio && coord.municipio.trim()) {
          clave = coord.municipio;
          usarCoordenadas = false;
        } else {
          clave = 'Sin ubicación';
          usarCoordenadas = false;
        }
      }

      const existing = ubicacionesAgrupadas.get(clave) || {
        coordinadoresConCoords: [],
        coordinadoresSinCoords: []
      };

      if (usarCoordenadas) {
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

    console.log(`📍 Se encontraron ${ubicacionesArray.length} ubicaciones únicas`);
    ubicacionesArray.forEach(([ubicacion, data]) => {
      console.log(`  - ${ubicacion}: ${data.coordinadoresConCoords.length + data.coordinadoresSinCoords.length} defensores`);
    });

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

    // Agregar ", Colombia" para mejorar la precisión de geocodificación
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

  inicializarMapa(centerLat?: number, centerLng?: number, zoomLevel?: number): void {
    if (this.ubicacionesUnicas.size === 0) {
      this.cargando = false;
      this.toastService.warning('No hay ubicaciones para mostrar');
      return;
    }

    console.log(`🗺️ Inicializando mapa con ${this.ubicacionesUnicas.size} marcadores`);
    console.log(`📊 Total defensores en el mapa: ${this.totalDefensores}`);

    // Calcular el centro del mapa basado en las ubicaciones
    const bounds = new window.google.maps.LatLngBounds();

    this.ubicacionesUnicas.forEach((data) => {
      const latLng = new window.google.maps.LatLng(data.lat, data.lng);
      bounds.extend(latLng);
    });

    // Determinar centro y zoom
    const defaultCenter = { lat: 4.570868, lng: -74.297333 }; // Centro de Colombia
    const center = (centerLat && centerLng) ? { lat: centerLat, lng: centerLng } : defaultCenter;
    const zoom = zoomLevel || 6;

    // Crear el mapa
    const mapOptions = {
      zoom: zoom,
      center: center,
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

    // Ajustar el zoom para mostrar todas las ubicaciones (solo si no se especificó centro/zoom)
    if (!centerLat && !centerLng) {
      this.map.fitBounds(bounds);
    }

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

  filtrarPorEvento(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.cargando = true;
    
    // Primero aplicar filtro de evento si existe
    let coordinadoresFiltrados: Coordinador[];
    
    if (this.eventoSeleccionadoId) {
      // Cargar coordinadores que tienen llamadas asociadas al evento seleccionado
      this.coordinadorService.obtenerPorEventoEnLlamadas(this.eventoSeleccionadoId).subscribe({
        next: (data) => {
          // Eliminar duplicados
          const coordinadoresUnicos = Array.from(
            new Map(data.map(c => [c.id, c])).values()
          );
          this.aplicarFiltrosUbicacion(coordinadoresUnicos);
        },
        error: (error) => {
          this.toastService.error('Error al filtrar por evento');
          console.error('Error:', error);
          this.cargando = false;
        }
      });
    } else {
      // Sin filtro de evento, usar todos los coordinadores
      this.aplicarFiltrosUbicacion([...this.todosLosCoordinadores]);
    }
  }

  // Aplicar filtros de ubicación (municipio o sector)
  aplicarFiltrosUbicacion(coordinadoresBase: Coordinador[]): void {
    let coordinadoresFiltrados = coordinadoresBase;

    if (this.tipoFiltroUbicacion === 'municipio' && this.municipioSeleccionado) {
      // Filtrar por municipio
      coordinadoresFiltrados = coordinadoresBase.filter(c => 
        c.municipio && c.municipio.trim() === this.municipioSeleccionado
      );
    } else if (this.tipoFiltroUbicacion === 'sector' && this.sectorSeleccionado) {
      // Filtrar por sector (formato: "sector|municipio")
      const [sector, municipio] = this.sectorSeleccionado.split('|');
      coordinadoresFiltrados = coordinadoresBase.filter(c => 
        c.sector && c.sector.trim() === sector &&
        (!municipio || (c.municipio && c.municipio.trim() === municipio))
      );
    }

    this.coordinadores = coordinadoresFiltrados;
    this.totalDefensores = this.coordinadores.length;
    this.limpiarMapa();
    
    // Si hay un sector seleccionado, centrar el mapa en ese sector
    if (this.tipoFiltroUbicacion === 'sector' && this.sectorSeleccionado) {
      const [sector, municipio] = this.sectorSeleccionado.split('|');
      const sectorInfo = this.sectoresUnicos.find(s => s.sector === sector && s.municipio === municipio);
      if (sectorInfo && sectorInfo.lat && sectorInfo.lng) {
        this.procesarUbicacionesPorSector(sectorInfo);
        return;
      }
    }
    
    this.procesarUbicaciones();
  }

  // Procesar ubicaciones cuando se filtra por sector específico
  procesarUbicacionesPorSector(sectorInfo: { sector: string; municipio: string; lat?: number; lng?: number }): void {
    // Agrupar por sector específico
    const ubicacion = `${sectorInfo.sector}, ${sectorInfo.municipio}`;
    
    this.ubicacionesUnicas.set(ubicacion, {
      count: this.coordinadores.length,
      lat: sectorInfo.lat!,
      lng: sectorInfo.lng!
    });

    this.inicializarMapa(sectorInfo.lat, sectorInfo.lng, 15); // Zoom más cercano para sectores
  }

  limpiarMapa(): void {
    // Limpiar mapa anterior
    this.markers.forEach(marker => {
      if (marker.marker) marker.marker.map = null;
      if (marker.circle) marker.circle.setMap(null);
    });
    this.markers = [];
    this.ubicacionesUnicas.clear();
  }
}