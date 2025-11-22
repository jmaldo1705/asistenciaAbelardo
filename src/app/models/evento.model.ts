export interface Evento {
    id?: number;
    nombre: string;
    lugar: string;
    fecha: string; // ISO string
    observaciones?: string;
}
