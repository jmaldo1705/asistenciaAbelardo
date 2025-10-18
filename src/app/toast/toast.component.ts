import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" 
           class="toast"
           [class.toast-success]="toast.type === 'success'"
           [class.toast-error]="toast.type === 'error'"
           [class.toast-warning]="toast.type === 'warning'"
           [class.toast-info]="toast.type === 'info'">
        <div class="toast-icon">{{ toast.icon }}</div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="remove(toast.id)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      background: white;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      pointer-events: all;
      animation: slideInRight 0.3s ease, fadeIn 0.3s ease;
      border-left: 4px solid;
      transition: all 0.3s ease;
    }

    .toast:hover {
      transform: translateX(-5px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    }

    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .toast-success {
      border-left-color: #10b981;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    }

    .toast-error {
      border-left-color: #ef4444;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
    }

    .toast-warning {
      border-left-color: #f59e0b;
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
    }

    .toast-info {
      border-left-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
    }

    .toast-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      animation: bounce 0.6s ease;
    }

    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    .toast-message {
      flex: 1;
      font-size: 0.95rem;
      font-weight: 500;
      line-height: 1.4;
      color: #1f2937;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .toast-success .toast-message {
      color: #065f46;
    }

    .toast-error .toast-message {
      color: #991b1b;
    }

    .toast-warning .toast-message {
      color: #92400e;
    }

    .toast-info .toast-message {
      color: #1e40af;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
        align-items: stretch;
      }

      .toast {
        min-width: auto;
        max-width: none;
        padding: 12px 16px;
      }

      .toast-icon {
        font-size: 1.3rem;
      }

      .toast-message {
        font-size: 0.9rem;
      }
    }

    @media (max-width: 480px) {
      .toast {
        padding: 10px 14px;
      }

      .toast-icon {
        font-size: 1.2rem;
      }

      .toast-message {
        font-size: 0.85rem;
      }
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
      console.log('Toasts actualizados:', toasts); // Debug
    });
  }

  remove(id: number): void {
    this.toastService.remove(id);
  }
}
