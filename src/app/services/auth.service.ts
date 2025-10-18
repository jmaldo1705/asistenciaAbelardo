import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_token';

  // Credenciales predeterminadas (en producción esto vendría del backend)
  private usuarios = [
    { usuario: 'admin', password: 'Ibague2025', nombre: 'Administrador' }
  ];

  constructor() { }

  login(usuario: string, password: string): boolean {
    const usuarioEncontrado = this.usuarios.find(
      u => u.usuario === usuario && u.password === password
    );

    if (usuarioEncontrado) {
      // Guardamos un token simple en localStorage
      const token = btoa(usuario + ':' + new Date().getTime());
      localStorage.setItem(this.STORAGE_KEY, token);
      localStorage.setItem('usuario_nombre', usuarioEncontrado.nombre);
      return true;
    }

    return false;
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('usuario_nombre');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  getNombreUsuario(): string {
    return localStorage.getItem('usuario_nombre') || 'Usuario';
  }
}
