import { Injectable, signal, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private swUpdate = inject(SwUpdate);
  private updateAvailableSignal = signal(false);

  updateAvailable = this.updateAvailableSignal.asReadonly();

  constructor() {
    if (this.swUpdate.isEnabled) {
      // Controlla aggiornamenti ogni 6 ore
      const checkInterval = 6 * 60 * 60 * 1000;
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, checkInterval);

      // Ascolta per nuove versioni disponibili
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.updateAvailableSignal.set(true);
        });

      // Controlla immediatamente all'avvio
      this.swUpdate.checkForUpdate();
    }
  }

  /**
   * Applica l'aggiornamento e ricarica la pagina
   */
  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
    }
  }
}
