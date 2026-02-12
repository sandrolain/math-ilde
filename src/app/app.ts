import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { SwUpdateService } from './services/sw-update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateNotificationComponent],
  template: `
    <router-outlet />
    <app-update-notification />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class App {
  // Inizializza il servizio di aggiornamento
  private swUpdateService = inject(SwUpdateService);
}
