import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsistenciaService } from '../services/asistencia.service';
import { Asistencia } from '../models/asistencia.model';

@Component({
  selector: 'app-formulario',
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css']
})
export class FormularioComponent {
  asistencia: Asistencia = {
    nombre: '',
    apellido: '',
    email: '',
    observaciones: '',
    presente: true
  };

  mensaje: string = '';
  mostrarMensaje: boolean = false;
  tipoMensaje: 'success' | 'error' = 'success';

  constructor(
    private asistenciaService: AsistenciaService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.validarFormulario()) {
      this.asistenciaService.crear(this.asistencia).subscribe({
        next: (response) => {
          this.mostrarMensajeExito('¡Asistencia registrada exitosamente!');
          this.limpiarFormulario();
        },
        error: (error) => {
          this.mostrarMensajeError('Error al registrar la asistencia. Por favor, intente nuevamente.');
          console.error('Error:', error);
        }
      });
    }
  }

  validarFormulario(): boolean {
    if (!this.asistencia.nombre || !this.asistencia.apellido || !this.asistencia.email) {
      this.mostrarMensajeError('Por favor, complete todos los campos obligatorios.');
      return false;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.asistencia.email)) {
      this.mostrarMensajeError('Por favor, ingrese un email válido.');
      return false;
    }
    
    return true;
  }

  limpiarFormulario() {
    this.asistencia = {
      nombre: '',
      apellido: '',
      email: '',
      observaciones: '',
      presente: true
    };
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

  irAListado() {
    this.router.navigate(['/listado']);
  }
}
