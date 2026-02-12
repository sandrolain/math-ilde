import { Component, inject, effect } from '@angular/core';
import { SwUpdateService } from '../../services/sw-update.service';

@Component({
  selector: 'app-update-notification',
  imports: [],
  template: `
    @if (showNotification()) {
      <div class="update-banner">
        <div class="update-content">
          <p>🎉 È disponibile una nuova versione di Math-ilde!</p>
          <div class="update-actions">
            <button class="update-button" (click)="applyUpdate()">Aggiorna ora</button>
            <button class="dismiss-button" (click)="dismiss()">Più tardi</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .update-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .update-content {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      p {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 500;
      }

      .update-actions {
        display: flex;
        gap: 0.75rem;
      }

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 120px;
      }

      .update-button {
        background: white;
        color: #667eea;
      }

      .update-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
      }

      .dismiss-button {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid white;
      }

      .dismiss-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      @media (max-width: 600px) {
        .update-content {
          flex-direction: column;
          text-align: center;
        }

        .update-actions {
          width: 100%;
          flex-direction: column;
        }

        button {
          width: 100%;
        }
      }
    `,
  ],
})
export class UpdateNotificationComponent {
  private swUpdateService = inject(SwUpdateService);

  showNotification = this.swUpdateService.updateAvailable;

  applyUpdate(): void {
    this.swUpdateService.applyUpdate();
  }

  dismiss(): void {
    // Nascondi temporaneamente la notifica
    // L'utente vedrà di nuovo la notifica al prossimo refresh
    const banner = document.querySelector('.update-banner') as HTMLElement;
    if (banner) {
      banner.style.display = 'none';
    }
  }
}
