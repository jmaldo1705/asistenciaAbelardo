export interface Coordinador {
  id?: number;
  ciudad: string;
  municipio: string;
  nombreCompleto: string;
  celular: string;
  email?: string;
  fechaLlamada?: Date;
  confirmado: boolean;
  numeroInvitados: number;
  observaciones?: string;
  llamadas?: Llamada[];
  numeroLlamadas?: number;
}

export interface Llamada {
  id?: number;
  fecha: Date;
  observaciones?: string;
  coordinadorId?: number;
}

export interface Estadisticas {
  total: number;
}
