import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Evento } from '../models/evento.model';
import { EventoService } from '../services/evento.service';
import { ToastService } from '../services/toast.service';
import { GoogleMapsService } from '../services/google-maps.service';

@Component({
    selector: 'app-eventos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './eventos.component.html',
    styleUrl: './eventos.component.css'
})
export class EventosComponent implements OnInit {
    eventos: Evento[] = [];
    mostrarModal: boolean = false;
    modoEdicion: boolean = false;
    eventoActual: Evento = {
        nombre: '',
        lugar: '',
        fecha: '',
        observaciones: '',
        latitud: undefined,
        longitud: undefined
    };

    // Google Maps autocomplete para lugar
    lugarSugerencias: any[] = [];
    mostrandoSugerenciasLugar: boolean = false;
    lugarSeleccionadoDeLista: boolean = false;

    constructor(
        private eventoService: EventoService,
        private toastService: ToastService,
        private router: Router,
        private googleMapsService: GoogleMapsService
    ) { }

    ngOnInit(): void {
        this.cargarEventos();
    }

    cargarEventos(): void {
        this.eventoService.obtenerTodos().subscribe({
            next: (data) => {
                this.eventos = data;
            },
            error: (error) => {
                console.error('Error al cargar eventos:', error);
                this.toastService.error('Error al cargar eventos');
            }
        });
    }

    abrirModal(evento?: Evento): void {
        if (evento) {
            this.modoEdicion = true;
            this.eventoActual = { ...evento };
            // Si ya tiene coordenadas, considerarlo como seleccionado
            this.lugarSeleccionadoDeLista = !!(evento.latitud && evento.longitud);
        } else {
            this.modoEdicion = false;
            this.eventoActual = {
                nombre: '',
                lugar: '',
                fecha: new Date().toISOString().slice(0, 16), // Default to now
                observaciones: '',
                latitud: undefined,
                longitud: undefined
            };
            this.lugarSeleccionadoDeLista = false;
        }
        this.lugarSugerencias = [];
        this.mostrandoSugerenciasLugar = false;
        this.mostrarModal = true;
    }

    cerrarModal(): void {
        this.mostrarModal = false;
        this.lugarSugerencias = [];
        this.mostrandoSugerenciasLugar = false;
    }

    // Búsqueda de lugares con Google Maps
    async buscarLugar(event: any): Promise<void> {
        const input = event.target.value;
        
        // Resetear selección cuando el usuario escribe
        this.lugarSeleccionadoDeLista = false;
        
        if (input.length < 3) {
            this.lugarSugerencias = [];
            this.mostrandoSugerenciasLugar = false;
            return;
        }

        try {
            const predictions = await this.googleMapsService.getAddressSuggestions(input, 'CO');
            this.lugarSugerencias = predictions;
            this.mostrandoSugerenciasLugar = predictions.length > 0;
        } catch (error) {
            console.error('Error al buscar lugares:', error);
            this.lugarSugerencias = [];
            this.mostrandoSugerenciasLugar = false;
        }
    }

    async seleccionarLugar(prediction: any): Promise<void> {
        if (prediction.place_id) {
            try {
                const details = await this.googleMapsService.getPlaceDetails(prediction.place_id);
                if (details) {
                    // Formatear el lugar con información detallada
                    let lugarFormateado = '';
                    if (details.name && details.types && 
                        (details.types.includes('establishment') || 
                         details.types.includes('point_of_interest'))) {
                        lugarFormateado = details.name;
                        if (details.locality) {
                            lugarFormateado += `, ${details.locality}`;
                        }
                        if (details.administrativeArea) {
                            lugarFormateado += `, ${details.administrativeArea}`;
                        }
                    } else {
                        lugarFormateado = details.formattedAddress;
                    }
                    
                    this.eventoActual.lugar = lugarFormateado;
                    this.eventoActual.latitud = details.lat;
                    this.eventoActual.longitud = details.lng;
                    this.lugarSeleccionadoDeLista = true;
                    
                    this.toastService.success(`📍 Ubicación seleccionada: ${details.formattedAddress}`);
                } else {
                    this.eventoActual.lugar = prediction.description;
                    this.lugarSeleccionadoDeLista = false;
                }
            } catch (error) {
                console.error('Error al obtener detalles del lugar:', error);
                this.eventoActual.lugar = prediction.description;
                this.lugarSeleccionadoDeLista = false;
            }
        } else {
            this.eventoActual.lugar = prediction.description;
            this.lugarSeleccionadoDeLista = false;
        }
        
        this.lugarSugerencias = [];
        this.mostrandoSugerenciasLugar = false;
    }

    // Función para traducir tipos de lugar de Google Maps a español
    getPlaceTypeLabel(type: string): string {
        const typeLabels: { [key: string]: string } = {
            'street_address': '📍 Dirección',
            'route': '🛣️ Vía/Calle',
            'establishment': '🏪 Establecimiento',
            'point_of_interest': '📌 Punto de interés',
            'neighborhood': '🏘️ Barrio',
            'locality': '🏙️ Ciudad',
            'park': '🌳 Parque',
            'stadium': '🏟️ Estadio',
            'lodging': '🏨 Hotel',
            'restaurant': '🍽️ Restaurante',
            'cafe': '☕ Café'
        };
        return typeLabels[type] || '';
    }

    guardarEvento(): void {
        if (!this.eventoActual.nombre || !this.eventoActual.lugar || !this.eventoActual.fecha) {
            this.toastService.warning('Por favor complete los campos obligatorios');
            return;
        }

        if (this.modoEdicion && this.eventoActual.id) {
            this.eventoService.actualizar(this.eventoActual.id, this.eventoActual).subscribe({
                next: () => {
                    this.toastService.success('Evento actualizado correctamente');
                    this.cargarEventos();
                    this.cerrarModal();
                },
                error: (error) => {
                    console.error('Error al actualizar evento:', error);
                    this.toastService.error('Error al actualizar evento');
                }
            });
        } else {
            this.eventoService.crear(this.eventoActual).subscribe({
                next: () => {
                    this.toastService.success('Evento creado correctamente');
                    this.cargarEventos();
                    this.cerrarModal();
                },
                error: (error) => {
                    console.error('Error al crear evento:', error);
                    this.toastService.error('Error al crear evento');
                }
            });
        }
    }

    eliminarEvento(id: number): void {
        if (confirm('¿Está seguro de eliminar este evento?')) {
            this.eventoService.eliminar(id).subscribe({
                next: () => {
                    this.toastService.success('Evento eliminado correctamente');
                    this.cargarEventos();
                },
                error: (error) => {
                    console.error('Error al eliminar evento:', error);
                    this.toastService.error('Error al eliminar evento');
                }
            });
        }
    }

    volverACoordinadores(): void {
        this.router.navigate(['/coordinadores']);
    }
}
