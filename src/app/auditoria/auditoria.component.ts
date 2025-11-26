import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuditoriaService, PageResponse } from '../services/auditoria.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Auditoria } from '../models/auditoria.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  registros: Auditoria[] = [];
  registrosFiltrados: Auditoria[] = [];
  cargando = false;

  // Paginación
  paginaActual = 0;
  totalPaginas = 0;
  totalElementos = 0;
  tamanioPagina = 50;

  filtros = {
    fechaInicio: '',
    fechaFin: '',
    entidad: 'all',
    busqueda: ''
  };

  ngOnInit() {
    this.cargarAuditoria();
  }

  cargarAuditoria() {
    this.cargando = true;
    const params: any = {
      page: this.paginaActual,
      size: this.tamanioPagina
    };

    if (this.filtros.fechaInicio) {
      params.fechaInicio = new Date(this.filtros.fechaInicio).toISOString();
    }
    if (this.filtros.fechaFin) {
      params.fechaFin = new Date(this.filtros.fechaFin).toISOString();
    }
    if (this.filtros.entidad && this.filtros.entidad !== 'all') {
      params.entidad = this.filtros.entidad;
    }

    this.auditoriaService.obtenerAuditoria(params).subscribe({
      next: (data) => {
        this.registros = data.content;
        this.totalPaginas = data.totalPages;
        this.totalElementos = data.totalElements;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar auditoría:', err);
        this.toastService.error('Error al cargar registros de auditoría');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.registrosFiltrados = this.registros.filter(r => {
      if (this.filtros.busqueda) {
        const busqueda = this.filtros.busqueda.toLowerCase();
        return r.usuario.toLowerCase().includes(busqueda) ||
               r.detalle.toLowerCase().includes(busqueda) ||
               r.entidad.toLowerCase().includes(busqueda) ||
               r.accion.toLowerCase().includes(busqueda);
      }
      return true;
    });
  }

  limpiarFiltros() {
    this.filtros = {
      fechaInicio: '',
      fechaFin: '',
      entidad: 'all',
      busqueda: ''
    };
    this.paginaActual = 0;
    this.cargarAuditoria();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.cargarAuditoria();
    }
  }

  get paginasArray(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(0, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas);
    
    if (fin - inicio < maxPaginas) {
      inicio = Math.max(0, fin - maxPaginas);
    }
    
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearDetalle(detalle: string, accion: string): string {
    if (accion === 'MODIFICACIÓN' && detalle.includes('Cambios:')) {
      // Extraer solo los cambios sin el prefijo
      const partes = detalle.split('Cambios:');
      if (partes.length > 1) {
        const cambios = partes[1].trim();
        // Resaltar las flechas de cambio
        return cambios.replace(/→/g, '<span class="arrow">→</span>');
      }
    }
    return detalle;
  }

  getTitulo(detalle: string, accion: string): string {
    if (accion === 'MODIFICACIÓN' && detalle.includes(' - Cambios:')) {
      const partes = detalle.split(' - Cambios:');
      return partes[0];
    }
    if (detalle.includes(': ')) {
      const partes = detalle.split(': ');
      return partes[0] + ':';
    }
    return '';
  }

  volver() {
    this.router.navigate(['/coordinadores']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
