export interface Asistencia {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  fechaHora?: string;
  observaciones?: string;
  presente: boolean;
}
