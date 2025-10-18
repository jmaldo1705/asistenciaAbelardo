import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  icon: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private nextId = 1;

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): void {
    const icon = this.getIcon(type);
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      icon,
      duration
    };

    console.log('Toast creado:', toast); // Debug

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-remove después del duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }

  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 4000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 3500): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  remove(id: number): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
}
