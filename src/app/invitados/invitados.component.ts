import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CoordinadorService } from '../services/coordinador.service';
import { ToastService } from '../services/toast.service';
import { Coordinador, Invitado } from '../models/coordinador.model';

@Component({
  selector: 'app-invitados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invitados.component.html',
  styleUrl: './invitados.component.css'
})
export class InvitadosComponent implements OnInit {
  coordinador: Coordinador | null = null;
  invitados: Invitado[] = [];
  
  // Formulario de nuevo invitado
  mostrarFormulario: boolean = false;
  nuevoInvitado: Invitado = {
    nombre: '',
    cedula: '',
    telefono: ''
  };

  // Modal de confirmación para eliminar
  mostrarModalEliminar: boolean = false;
  invitadoAEliminar: Invitado | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coordinadorService: CoordinadorService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const coordinadorId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCoordinador(coordinadorId);
  }

  cargarCoordinador(id: number): void {
    this.coordinadorService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.coordinador = data;
        this.invitados = data.invitados || [];
      },
      error: (error) => {
        this.toastService.error('Error al cargar defensor');
        console.error('Error:', error);
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.limpiarFormulario();
    }
  }

  limpiarFormulario(): void {
    this.nuevoInvitado = {
      nombre: '',
      cedula: '',
      telefono: ''
    };
  }

  agregarInvitado(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.coordinadorService.agregarInvitado(this.coordinador!.id!, this.nuevoInvitado).subscribe({
      next: (data) => {
        this.toastService.success('👥 Invitado agregado exitosamente');
        this.coordinador = data;
        this.invitados = data.invitados || [];
        this.toggleFormulario();
      },
      error: (error) => {
        this.toastService.error('Error al agregar invitado');
        console.error('Error:', error);
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.nuevoInvitado.nombre.trim()) {
      this.toastService.warning('El nombre es obligatorio');
      return false;
    }
    if (!this.nuevoInvitado.cedula.trim()) {
      this.toastService.warning('La cédula es obligatoria');
      return false;
    }
    if (!this.nuevoInvitado.telefono.trim()) {
      this.toastService.warning('El teléfono es obligatorio');
      return false;
    }
    return true;
  }

  abrirModalEliminar(invitado: Invitado): void {
    this.invitadoAEliminar = invitado;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.invitadoAEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.invitadoAEliminar || !this.coordinador) return;

    this.coordinadorService.eliminarInvitado(this.coordinador.id!, this.invitadoAEliminar.id!).subscribe({
      next: (data) => {
        this.toastService.success('🗑️ Invitado eliminado exitosamente');
        this.coordinador = data;
        this.invitados = data.invitados || [];
        this.cerrarModalEliminar();
      },
      error: (error) => {
        this.toastService.error('Error al eliminar invitado');
        console.error('Error:', error);
        this.cerrarModalEliminar();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/coordinadores']);
  }
}
