import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento } from '../models/evento.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EventoService {
    private apiUrl = `${environment.apiUrl}/eventos`;

    constructor(private http: HttpClient) { }

    obtenerTodos(): Observable<Evento[]> {
        return this.http.get<Evento[]>(this.apiUrl);
    }

    obtenerPorId(id: number): Observable<Evento> {
        return this.http.get<Evento>(`${this.apiUrl}/${id}`);
    }

    crear(evento: Evento): Observable<Evento> {
        return this.http.post<Evento>(this.apiUrl, evento);
    }

    actualizar(id: number, evento: Evento): Observable<Evento> {
        return this.http.put<Evento>(`${this.apiUrl}/${id}`, evento);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
