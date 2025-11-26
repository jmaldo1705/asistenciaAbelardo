import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, CambiarPasswordRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getUserData());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.setUserData(response);
        this.currentUserSubject.next(response);
      })
    );
  }

  cambiarPassword(request: CambiarPasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/cambiar-password`, request);
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      complete: () => {
        this.clearAuth();
      },
      error: () => {
        // Limpiar de todos modos en caso de error
        this.clearAuth();
      }
    });
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getUserData(): LoginResponse | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private setUserData(user: LoginResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getNombreUsuario(): string {
    const userData = this.getUserData();
    return userData?.nombreCompleto || 'Usuario';
  }

  getUserId(): number | null {
    const userData = this.getUserData();
    return userData?.id || null;
  }

  getRoles(): string[] {
    const userData = this.getUserData();
    return userData?.roles || [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getRoles();
    return roles.some(role => userRoles.includes(role));
  }

  isAdmin(): boolean {
    return this.hasRole('ADMINISTRADOR');
  }

  isEditor(): boolean {
    return this.hasRole('EDITOR');
  }

  isVisor(): boolean {
    return this.hasRole('VISOR');
  }

  debeCambiarPassword(): boolean {
    const userData = this.getUserData();
    return userData?.debeCambiarPassword || false;
  }

  canEdit(): boolean {
    return this.hasAnyRole(['ADMINISTRADOR', 'EDITOR']);
  }

  canDelete(): boolean {
    return this.hasAnyRole(['ADMINISTRADOR', 'EDITOR']);
  }

  canExportExcel(): boolean {
    return this.hasRole('ADMINISTRADOR');
  }

  canManageUsers(): boolean {
    return this.hasRole('ADMINISTRADOR');
  }
}

