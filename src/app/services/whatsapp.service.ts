import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DestinatarioWhatsApp {
  celular: string;
  nombre: string;
  municipio?: string;
  sector?: string;
}

export interface ResultadoEnvio {
  nombre: string;
  celular: string;
  success: boolean;
  messageSid?: string;
  error?: string;
}

export interface RespuestaEnvioMasivo {
  success: boolean;
  total: number;
  exitosos: number;
  fallidos: number;
  resultados: ResultadoEnvio[];
  mensaje: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private apiUrl = `${environment.apiUrl}/whatsapp`;

  constructor(private http: HttpClient) { }

  /**
   * Envía un mensaje individual de WhatsApp
   */
  enviarMensaje(celular: string, mensaje: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar`, {
      to: celular,
      mensaje: mensaje
    });
  }

  /**
   * Envía mensajes masivos de WhatsApp
   */
  enviarMensajesMasivos(destinatarios: DestinatarioWhatsApp[], mensaje: string): Observable<RespuestaEnvioMasivo> {
    return this.http.post<RespuestaEnvioMasivo>(`${this.apiUrl}/enviar-masivo`, {
      destinatarios: destinatarios,
      mensaje: mensaje
    });
  }
}

