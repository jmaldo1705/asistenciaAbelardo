import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auditoria } from '../models/auditoria.model';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/auditoria';

  obtenerAuditoria(params?: {
    fechaInicio?: string;
    fechaFin?: string;
    entidad?: string;
    page?: number;
    size?: number;
  }): Observable<PageResponse<Auditoria>> {
    let url = this.baseUrl;
    const queryParams: string[] = [];

    if (params) {
      if (params.fechaInicio) queryParams.push(`fechaInicio=${params.fechaInicio}`);
      if (params.fechaFin) queryParams.push(`fechaFin=${params.fechaFin}`);
      if (params.entidad) queryParams.push(`entidad=${params.entidad}`);
      if (params.page !== undefined) queryParams.push(`page=${params.page}`);
      if (params.size !== undefined) queryParams.push(`size=${params.size}`);
    }

    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }

    return this.http.get<PageResponse<Auditoria>>(url);
  }
}
