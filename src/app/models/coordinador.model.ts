export interface Coordinador {
  id?: number;
  municipio: string;
  nombreCompleto: string;
  celular: string;
  fechaLlamada?: Date;
  confirmado: boolean;
  numeroInvitados: number;
  observaciones?: string;
  invitados?: Invitado[];
  estado?: 'pendiente' | 'confirmado' | 'no_asiste' | 'no_contesta';
}

export interface Invitado {
  id?: number;
  nombre: string;
  cedula: string;
  telefono: string;
  coordinadorId?: number;
}

export interface Estadisticas {
  total: number;
  confirmados: number;
  pendientes: number;
  noAsiste?: number;
  noContesta?: number;
}
