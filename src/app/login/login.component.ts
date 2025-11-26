import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { LoginRequest } from '../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  usuario: string = '';
  password: string = '';
  mensaje: string = '';
  cargando: boolean = false;
  mostrarModalCambioPassword: boolean = false;
  
  // Datos para cambio de contraseña
  passwordActual: string = '';
  passwordNueva: string = '';
  passwordConfirmacion: string = '';
  mensajeCambioPassword: string = '';
  cargandoCambioPassword: boolean = false;

  ngOnInit(): void {
    // Si ya está logueado, redirigir al dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/coordinadores']);
    }
  }

  login(): void {
    if (!this.usuario.trim() || !this.password.trim()) {
      this.mensaje = 'Por favor complete todos los campos';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    const credentials: LoginRequest = {
      username: this.usuario.trim(),
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.cargando = false;
        
        // Verificar si debe cambiar la contraseña
        if (response.debeCambiarPassword) {
          this.toastService.show('Debe cambiar su contraseña temporal', 'warning');
          this.mostrarModalCambioPassword = true;
          this.passwordActual = this.password; // Pre-llenar con la contraseña temporal
        } else {
          this.toastService.show('Bienvenido ' + response.nombreCompleto, 'success');
          this.router.navigate(['/coordinadores']);
        }
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error de login:', error);
        
        if (error.error && error.error.error) {
          this.mensaje = error.error.error;
        } else {
          this.mensaje = 'Error al iniciar sesión. Por favor intente nuevamente.';
        }
      }
    });
  }

  cambiarPassword(): void {
    if (!this.passwordNueva || !this.passwordConfirmacion) {
      this.mensajeCambioPassword = 'Por favor complete todos los campos';
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmacion) {
      this.mensajeCambioPassword = 'Las contraseñas no coinciden';
      return;
    }

    if (this.passwordNueva.length < 8) {
      this.mensajeCambioPassword = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    this.cargandoCambioPassword = true;
    this.mensajeCambioPassword = '';

    this.authService.cambiarPassword({
      passwordActual: this.passwordActual,
      passwordNueva: this.passwordNueva,
      passwordConfirmacion: this.passwordConfirmacion
    }).subscribe({
      next: () => {
        this.cargandoCambioPassword = false;
        this.toastService.show('Contraseña cambiada exitosamente', 'success');
        this.cerrarModalCambioPassword();
        this.router.navigate(['/coordinadores']);
      },
      error: (error) => {
        this.cargandoCambioPassword = false;
        console.error('Error al cambiar contraseña:', error);
        
        if (error.error && error.error.error) {
          this.mensajeCambioPassword = error.error.error;
        } else {
          this.mensajeCambioPassword = 'Error al cambiar la contraseña. Por favor intente nuevamente.';
        }
      }
    });
  }

  cerrarModalCambioPassword(): void {
    this.mostrarModalCambioPassword = false;
    this.passwordNueva = '';
    this.passwordConfirmacion = '';
    this.mensajeCambioPassword = '';
  }

  cancelarCambioPassword(): void {
    // Si cancela, hacer logout
    this.authService.logout();
    this.cerrarModalCambioPassword();
  }
}
