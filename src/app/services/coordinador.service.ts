import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coordinador, Invitado, Estadisticas } from '../models/coordinador.model';

@Injectable({
  providedIn: 'root'
})
export class CoordinadorService {
  private apiUrl = 'http://localhost:8080/api/coordinadores';

  constructor(private http: HttpClient) { }

  obtenerTodos(): Observable<Coordinador[]> {
    return this.http.get<Coordinador[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Coordinador> {
    return this.http.get<Coordinador>(`${this.apiUrl}/${id}`);
  }

  buscarPorMunicipio(municipio: string): Observable<Coordinador[]> {
    return this.http.get<Coordinador[]>(`${this.apiUrl}/buscar?municipio=${municipio}`);
  }

  obtenerConfirmados(confirmado: boolean): Observable<Coordinador[]> {
    return this.http.get<Coordinador[]>(`${this.apiUrl}/confirmados?confirmado=${confirmado}`);
  }

  crear(coordinador: Coordinador): Observable<Coordinador> {
    return this.http.post<Coordinador>(this.apiUrl, coordinador);
  }

  actualizar(id: number, coordinador: Coordinador): Observable<Coordinador> {
    return this.http.put<Coordinador>(`${this.apiUrl}/${id}`, coordinador);
  }

  confirmarLlamada(id: number, numeroInvitados: number, observaciones: string): Observable<Coordinador> {
    return this.http.put<Coordinador>(`${this.apiUrl}/${id}/confirmar`, {
      numeroInvitados,
      observaciones
    });
  }

  desmarcarConfirmacion(id: number): Observable<Coordinador> {
    return this.http.put<Coordinador>(`${this.apiUrl}/${id}/desmarcar`, {});
  }

  agregarInvitado(coordinadorId: number, invitado: Invitado): Observable<Coordinador> {
    return this.http.post<Coordinador>(`${this.apiUrl}/${coordinadorId}/invitados`, invitado);
  }

  eliminarInvitado(coordinadorId: number, invitadoId: number): Observable<Coordinador> {
    return this.http.delete<Coordinador>(`${this.apiUrl}/${coordinadorId}/invitados/${invitadoId}`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerEstadisticas(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.apiUrl}/estadisticas`);
  }
}
