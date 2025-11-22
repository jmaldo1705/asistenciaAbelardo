import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Evento } from '../models/evento.model';
import { EventoService } from '../services/evento.service';
import { ToastService } from '../services/toast.service';

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
        observaciones: ''
    };

    constructor(
        private eventoService: EventoService,
        private toastService: ToastService,
        private router: Router
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
        } else {
            this.modoEdicion = false;
            this.eventoActual = {
                nombre: '',
                lugar: '',
                fecha: new Date().toISOString().slice(0, 16), // Default to now
                observaciones: ''
            };
        }
        this.mostrarModal = true;
    }

    cerrarModal(): void {
        this.mostrarModal = false;
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
