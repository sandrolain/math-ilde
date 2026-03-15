import { Component, model, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-sidebar-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sidebar' },
  template: `
    <div class="lg:hidden flex justify-start mb-4">
      <button
        (click)="toggle()"
        class="btn btn-primary"
        [attr.aria-expanded]="open()"
        aria-label="Apri opzioni"
      >
        {{ open() ? '✕ Chiudi' : '☰ Opzioni' }}
      </button>
    </div>

    <div class="sidebar-panel" [class.is-open]="open()">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-bold text-(--color-text-primary)">Opzioni</h3>
        <button
          (click)="toggle()"
          class="lg:hidden text-2xl text-(--color-text-primary)"
          aria-label="Chiudi opzioni"
        >
          ✕
        </button>
      </div>

      <ng-content />
    </div>
  `,
  styles: [
    `
      .sidebar-panel {
        translate: -100%;
      }
      .sidebar-panel.is-open {
        translate: 0;
      }
      @media (min-width: 1024px) {
        .sidebar-panel {
          translate: 0;
        }
      }
    `,
  ],
})
export class SidebarOptionsComponent {
  open = model(false);
  toggle(): void {
    this.open.update((v) => !v);
  }
}
