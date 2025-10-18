import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsistenciaService } from '../services/asistencia.service';
import { Asistencia } from '../models/asistencia.model';

@Component({
  selector: 'app-listado',
  imports: [CommonModule, FormsModule],
  templateUrl: './listado.component.html',
  styleUrls: ['./listado.component.css']
})
export class ListadoComponent implements OnInit {
  asistencias: Asistencia[] = [];
  asistenciasFiltradas: Asistencia[] = [];
  cargando: boolean = false;
  mensaje: string = '';
  mostrarMensaje: boolean = false;
  tipoMensaje: 'success' | 'error' = 'success';
  
  // Filtros
  filtroNombre: string = '';
  filtroPresencia: string = 'todos';

  constructor(
    private asistenciaService: AsistenciaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarAsistencias();
  }

  cargarAsistencias() {
    this.cargando = true;
    this.asistenciaService.obtenerTodas().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.asistenciasFiltradas = data;
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensajeError('Error al cargar las asistencias');
        console.error('Error:', error);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.asistenciasFiltradas = this.asistencias.filter(asistencia => {
      const cumpleFiltroNombre = !this.filtroNombre || 
        asistencia.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase()) ||
        asistencia.apellido.toLowerCase().includes(this.filtroNombre.toLowerCase());
      
      const cumpleFiltroPresencia = this.filtroPresencia === 'todos' ||
        (this.filtroPresencia === 'presente' && asistencia.presente) ||
        (this.filtroPresencia === 'ausente' && !asistencia.presente);
      
      return cumpleFiltroNombre && cumpleFiltroPresencia;
    });
  }

  eliminarAsistencia(id: number | undefined) {
    if (!id) return;
    
    if (confirm('¿Está seguro de que desea eliminar este registro?')) {
      this.asistenciaService.eliminar(id).subscribe({
        next: () => {
          this.mostrarMensajeExito('Asistencia eliminada correctamente');
          this.cargarAsistencias();
        },
        error: (error) => {
          this.mostrarMensajeError('Error al eliminar la asistencia');
          console.error('Error:', error);
        }
      });
    }
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  mostrarMensajeExito(texto: string) {
    this.mensaje = texto;
    this.tipoMensaje = 'success';
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 3000);
  }

  mostrarMensajeError(texto: string) {
    this.mensaje = texto;
    this.tipoMensaje = 'error';
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 3000);
  }

  irAFormulario() {
    this.router.navigate(['/formulario']);
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroPresencia = 'todos';
    this.aplicarFiltros();
  }
}
