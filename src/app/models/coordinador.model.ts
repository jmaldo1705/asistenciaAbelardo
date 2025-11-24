import { Evento } from './evento.model';

export interface Coordinador {
  id?: number;
  municipio: string;
  sector: string;
  nombreCompleto: string;
  celular: string;
  email?: string;
  cedula?: string;
  fechaLlamada?: Date;
  confirmado: boolean;
  numeroInvitados: number;
  observaciones?: string;
  latitud?: number;
  longitud?: number;
  llamadas?: Llamada[];
  numeroLlamadas?: number;
  eventos?: Evento[];
}

export interface Llamada {
  id?: number;
  fecha: Date;
  observaciones?: string;
  coordinadorId?: number;
  evento?: Evento;
}

export interface Estadisticas {
  total: number;
}
