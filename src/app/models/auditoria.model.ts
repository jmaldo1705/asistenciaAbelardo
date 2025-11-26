export interface Auditoria {
  id: number;
  entidad: string;
  entidadId: number;
  accion: string;
  usuario: string;
  fecha: string;
  detalle: string;
}
