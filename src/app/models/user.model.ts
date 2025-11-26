export interface Usuario {
  id: number;
  username: string;
  password?: string;
  email: string;
  nombreCompleto: string;
  activo: boolean;
  debeCambiarPassword: boolean;
  fechaCreacion: Date;
  fechaUltimaModificacion?: Date;
  ultimoLogin?: Date;
  intentosFallidos: number;
  cuentaBloqueada: boolean;
  roles: Rol[];
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  roles: string[];
  debeCambiarPassword: boolean;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
  passwordConfirmacion: string;
}

export interface UsuarioCreate {
  username: string;
  password: string;
  email: string;
  nombreCompleto: string;
  roles: number[];
}

export interface UsuarioUpdate {
  username: string;
  email: string;
  nombreCompleto: string;
  activo: boolean;
  password?: string;
}
