import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coordinador, Llamada, Estadisticas } from '../models/coordinador.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoordinadorService {
  private apiUrl = `${environment.apiUrl}/coordinadores`;

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

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  // Métodos para gestionar llamadas
  registrarLlamada(coordinadorId: number, observaciones: string, eventoId?: number): Observable<Llamada> {
    return this.http.post<Llamada>(`${environment.apiUrl}/llamadas/coordinador/${coordinadorId}`, {
      observaciones,
      eventoId
    });
  }

  obtenerLlamadasPorCoordinador(coordinadorId: number): Observable<Llamada[]> {
    return this.http.get<Llamada[]>(`${environment.apiUrl}/llamadas/coordinador/${coordinadorId}`);
  }

  eliminarLlamada(llamadaId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/llamadas/${llamadaId}`);
  }

  // Métodos para gestionar eventos
  asignarEvento(coordinadorId: number, eventoId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${coordinadorId}/eventos/${eventoId}`, {});
  }

  desasignarEvento(coordinadorId: number, eventoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${coordinadorId}/eventos/${eventoId}`);
  }

  obtenerPorEventoEnLlamadas(eventoId: number): Observable<Coordinador[]> {
    return this.http.get<Coordinador[]>(`${this.apiUrl}/por-evento-llamadas/${eventoId}`);
  }
}
