import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  usuario: string = '';
  password: string = '';
  mensaje: string = '';
  cargando: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  login(): void {
    if (!this.usuario.trim() || !this.password.trim()) {
      this.mensaje = 'Por favor complete todos los campos';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    // Simulamos una llamada al servidor
    setTimeout(() => {
      if (this.authService.login(this.usuario, this.password)) {
        this.router.navigate(['/coordinadores']);
      } else {
        this.mensaje = 'Usuario o contraseña incorrectos';
        this.cargando = false;
      }
    }, 500);
  }
}
