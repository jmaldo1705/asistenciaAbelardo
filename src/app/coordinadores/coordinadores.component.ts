import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoordinadorService } from '../services/coordinador.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Coordinador, Estadisticas } from '../models/coordinador.model';

@Component({
  selector: 'app-coordinadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coordinadores.component.html',
  styleUrl: './coordinadores.component.css'
})
export class CoordinadoresComponent implements OnInit {
  coordinadores: Coordinador[] = [];
  estadisticas: Estadisticas = { total: 0, confirmados: 0, pendientes: 0 };
  nombreUsuario: string = '';
  
  // Filtros
  filtroMunicipio: string = '';
  filtroEstado: string = 'todos';
  
  // Modal de confirmación
  mostrarModal: boolean = false;
  coordinadorSeleccionado: Coordinador | null = null;
  numeroInvitados: number = 0;
  observaciones: string = '';
  
  // Modal de nuevo coordinador
  mostrarModalNuevo: boolean = false;
  nuevoCoordinador: Coordinador = {
    municipio: '',
    nombreCompleto: '',
    celular: '',
    confirmado: false,
    numeroInvitados: 0
  };
  
  // Modal de confirmación de eliminación
  mostrarModalEliminar: boolean = false;
  coordinadorAEliminar: Coordinador | null = null;
  
  // Modal de confirmación de desmarcar
  mostrarModalDesmarcar: boolean = false;
  coordinadorADesmarcar: Coordinador | null = null;

  constructor(
    private coordinadorService: CoordinadorService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.nombreUsuario = this.authService.getNombreUsuario();
    this.cargarCoordinadores();
    this.cargarEstadisticas();
  }

  cargarCoordinadores(): void {
    this.coordinadorService.obtenerTodos().subscribe({
      next: (data) => {
        this.coordinadores = data;
      },
      error: (error) => {
        this.toastService.error('Error al cargar coordinadores');
        console.error('Error:', error);
      }
    });
  }

  cargarEstadisticas(): void {
    this.coordinadorService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  get coordinadoresFiltrados(): Coordinador[] {
    const filtrados = this.coordinadores.filter(coord => {
      const coincideMunicipio = !this.filtroMunicipio || 
        coord.municipio.toLowerCase().includes(this.filtroMunicipio.toLowerCase());
      
      const coincideEstado = this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'confirmados' && coord.confirmado) ||
        (this.filtroEstado === 'pendientes' && !coord.confirmado);
      
      return coincideMunicipio && coincideEstado;
    });

    // Ordenar: primero los NO confirmados, luego los confirmados
    return filtrados.sort((a, b) => {
      if (a.confirmado === b.confirmado) return 0;
      return a.confirmado ? 1 : -1; // No confirmados primero
    });
  }

  abrirModalConfirmacion(coordinador: Coordinador): void {
    this.coordinadorSeleccionado = coordinador;
    this.numeroInvitados = coordinador.numeroInvitados || 0;
    this.observaciones = coordinador.observaciones || '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.coordinadorSeleccionado = null;
    this.numeroInvitados = 0;
    this.observaciones = '';
  }

  confirmarLlamada(): void {
    if (!this.coordinadorSeleccionado || this.numeroInvitados < 0) {
      this.toastService.warning('Por favor, ingrese un número válido de invitados');
      return;
    }

    const coordinadorId = this.coordinadorSeleccionado.id!;
    
    this.coordinadorService.confirmarLlamada(
      coordinadorId,
      this.numeroInvitados,
      this.observaciones
    ).subscribe({
      next: () => {
        this.toastService.success('✅ Llamada confirmada exitosamente');
        this.cerrarModal();
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        // Redirigir automáticamente a la pantalla de invitados
        setTimeout(() => {
          this.router.navigate(['/coordinadores', coordinadorId, 'invitados']);
        }, 1000);
      },
      error: (error) => {
        this.toastService.error('Error al confirmar llamada');
        console.error('Error:', error);
      }
    });
  }

  verInvitados(coordinador: Coordinador): void {
    this.router.navigate(['/coordinadores', coordinador.id, 'invitados']);
  }

  abrirModalNuevo(): void {
    this.nuevoCoordinador = {
      municipio: '',
      nombreCompleto: '',
      celular: '',
      confirmado: false,
      numeroInvitados: 0
    };
    this.mostrarModalNuevo = true;
  }

  cerrarModalNuevo(): void {
    this.mostrarModalNuevo = false;
  }

  guardarNuevoCoordinador(): void {
    // Validaciones
    if (!this.nuevoCoordinador.municipio.trim()) {
      this.toastService.warning('El municipio es obligatorio');
      return;
    }
    if (!this.nuevoCoordinador.nombreCompleto.trim()) {
      this.toastService.warning('El nombre completo es obligatorio');
      return;
    }
    if (!this.nuevoCoordinador.celular.trim()) {
      this.toastService.warning('El celular es obligatorio');
      return;
    }

    this.coordinadorService.crear(this.nuevoCoordinador).subscribe({
      next: () => {
        this.toastService.success('✅ Coordinador creado exitosamente');
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        this.cerrarModalNuevo();
      },
      error: (error) => {
        this.toastService.error('Error al crear coordinador');
        console.error('Error:', error);
      }
    });
  }

  desmarcarConfirmacion(coordinador: Coordinador): void {
    this.coordinadorADesmarcar = coordinador;
    this.mostrarModalDesmarcar = true;
  }

  confirmarDesmarcar(): void {
    if (!this.coordinadorADesmarcar) return;
    
    this.coordinadorService.desmarcarConfirmacion(this.coordinadorADesmarcar.id!).subscribe({
      next: () => {
        this.toastService.success('↺ Confirmación desmarcada exitosamente');
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        this.cerrarModalDesmarcar();
      },
      error: (error) => {
        this.toastService.error('Error al desmarcar confirmación');
        console.error('Error:', error);
        this.cerrarModalDesmarcar();
      }
    });
  }

  cerrarModalDesmarcar(): void {
    this.mostrarModalDesmarcar = false;
    this.coordinadorADesmarcar = null;
  }

  eliminarCoordinador(coordinador: Coordinador): void {
    this.coordinadorAEliminar = coordinador;
    this.mostrarModalEliminar = true;
  }

  confirmarEliminar(): void {
    if (!this.coordinadorAEliminar) return;
    
    this.coordinadorService.eliminar(this.coordinadorAEliminar.id!).subscribe({
      next: () => {
        this.toastService.success('🗑️ Coordinador eliminado exitosamente');
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        this.cerrarModalEliminar();
      },
      error: (error) => {
        this.toastService.error('Error al eliminar coordinador');
        console.error('Error:', error);
        this.cerrarModalEliminar();
      }
    });
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.coordinadorAEliminar = null;
  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return 'No contactado';
    return new Date(fecha).toLocaleString('es-ES');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
