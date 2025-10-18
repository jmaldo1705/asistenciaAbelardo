import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asistencia } from '../models/asistencia.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private apiUrl = `${environment.apiUrl}/asistencias`;

  constructor(private http: HttpClient) { }

  // Obtener todas las asistencias
  obtenerTodas(): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(this.apiUrl);
  }

  // Obtener asistencia por ID
  obtenerPorId(id: number): Observable<Asistencia> {
    return this.http.get<Asistencia>(`${this.apiUrl}/${id}`);
  }

  // Crear nueva asistencia
  crear(asistencia: Asistencia): Observable<Asistencia> {
    return this.http.post<Asistencia>(this.apiUrl, asistencia);
  }

  // Actualizar asistencia
  actualizar(id: number, asistencia: Asistencia): Observable<Asistencia> {
    return this.http.put<Asistencia>(`${this.apiUrl}/${id}`, asistencia);
  }

  // Eliminar asistencia
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Buscar por nombre
  buscarPorNombre(nombre: string): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.apiUrl}/buscar/nombre/${nombre}`);
  }

  // Buscar por estado de presencia
  buscarPorPresente(presente: boolean): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.apiUrl}/buscar/presente/${presente}`);
  }
}
