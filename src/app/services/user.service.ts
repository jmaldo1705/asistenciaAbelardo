import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, UsuarioCreate, UsuarioUpdate, Rol } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl + '/usuarios';
  private readonly ROLES_URL = environment.apiUrl + '/roles';

  obtenerTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.API_URL);
  }

  obtenerPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/${id}`);
  }

  obtenerPorUsername(username: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/username/${username}`);
  }

  crear(usuario: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, usuario);
  }

  actualizar(id: number, usuario: UsuarioUpdate): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.API_URL}/${id}`, usuario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  asignarRoles(usuarioId: number, rolesIds: number[]): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.API_URL}/${usuarioId}/roles`, rolesIds);
  }

  agregarRol(usuarioId: number, rolId: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.API_URL}/${usuarioId}/roles/${rolId}`, {});
  }

  quitarRol(usuarioId: number, rolId: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.API_URL}/${usuarioId}/roles/${rolId}`);
  }

  desbloquearCuenta(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/desbloquear`, {});
  }

  resetearPassword(id: number, nuevaPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/resetear-password`, { nuevaPassword });
  }

  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.ROLES_URL);
  }

  obtenerRolPorId(id: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.ROLES_URL}/${id}`);
  }
}
