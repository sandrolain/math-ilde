import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <div class="bg-app flex items-center justify-center p-4">
      <div class="max-w-4xl w-full">
        <h1 class="page-title">Math-ilde</h1>
        <p
          class="text-xl text-center mb-12 text-[var(--color-text-secondary)] animate-[fadeIn_0.7s_ease-out]"
        >
          Impara la matematica divertendoti!
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Addizioni e Sottrazioni -->
          <a
            routerLink="/addizioni-sottrazioni"
            class="card card-interactive card-section animate-[fadeIn_0.9s_ease-out]"
            aria-label="Vai alla sezione Addizioni e Sottrazioni"
          >
            <div class="text-6xl text-center mb-4 group-hover:animate-[pulse_0.5s_ease-in-out]">
              ➕➖
            </div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Addizioni e Sottrazioni
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Impara a sommare e sottrarre
            </p>
          </a>

          <!-- Moltiplicazioni -->
          <a
            routerLink="/moltiplicazioni"
            class="card card-interactive card-section animate-[fadeIn_1.1s_ease-out]"
            aria-label="Vai alla sezione Moltiplicazioni"
          >
            <div class="text-6xl text-center mb-4 group-hover:animate-[pulse_0.5s_ease-in-out]">
              ✖️
            </div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Moltiplicazioni
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">Scopri le tabelline</p>
          </a>

          <!-- Divisioni -->
          <a
            routerLink="/divisioni"
            class="card card-interactive card-section animate-[fadeIn_1.3s_ease-out]"
            aria-label="Vai alla sezione Divisioni"
          >
            <div class="text-6xl text-center mb-4 group-hover:animate-[pulse_0.5s_ease-in-out]">
              ➗
            </div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Divisioni
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">Dividi e conquista</p>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HomeComponent {}
