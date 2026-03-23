import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <div class="bg-app flex items-center justify-center p-4">
      <div class="max-w-5xl w-full">
        <h1 class="page-title">Math-ilde</h1>
        <p
          class="text-xl text-center mb-12 text-[var(--color-text-secondary)] animate-[fadeIn_0.7s_ease-out]"
        >
          Impara la matematica divertendoti!
        </p>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

          <!-- Scomposizione -->
          <a
            routerLink="/scomposizione"
            class="card card-interactive card-section animate-[fadeIn_1.5s_ease-out]"
            aria-label="Vai alla sezione Scomposizione della Somma"
          >
            <div class="text-6xl text-center mb-4 group-hover:animate-[pulse_0.5s_ease-in-out]">
              🧩
            </div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Scomposizione
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">Scomponi le somme</p>
          </a>

          <!-- Sillabe -->
          <a
            routerLink="/sillabe"
            class="card card-interactive card-section animate-[fadeIn_1.7s_ease-out]"
            aria-label="Vai alla sezione Lettura a Sillabe"
          >
            <div class="text-6xl text-center mb-4">🔤</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Sillabe
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Leggi le parole sillaba per sillaba
            </p>
          </a>

          <!-- Tabelline -->
          <a
            routerLink="/tabelline"
            class="card card-interactive card-section animate-[fadeIn_1.9s_ease-out]"
            aria-label="Vai alla sezione Tabelline"
          >
            <div class="text-6xl text-center mb-4">📊</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Tabelline
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Ordina i risultati della tabellina
            </p>
          </a>

          <!-- Sequenze Numeriche -->
          <a
            routerLink="/sequenze"
            class="card card-interactive card-section animate-[fadeIn_2.1s_ease-out]"
            aria-label="Vai alla sezione Sequenze Numeriche"
          >
            <div class="text-6xl text-center mb-4">🔢</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Sequenze
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Trova i numeri mancanti nella sequenza
            </p>
          </a>

          <!-- Frazioni Visive -->
          <a
            routerLink="/frazioni"
            class="card card-interactive card-section animate-[fadeIn_2.3s_ease-out]"
            aria-label="Vai alla sezione Frazioni Visive"
          >
            <div class="text-6xl text-center mb-4">🥧</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Frazioni
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Scopri le frazioni con figure e torte
            </p>
          </a>

          <!-- Lettura Orologio -->
          <a
            routerLink="/orologio"
            class="card card-interactive card-section animate-[fadeIn_2.5s_ease-out]"
            aria-label="Vai alla sezione Lettura dell'Orologio"
          >
            <div class="text-6xl text-center mb-4">⏰</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Orologio
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Impara a leggere l'orologio
            </p>
          </a>

          <!-- Misure e Conversioni -->
          <a
            routerLink="/misure"
            class="card card-interactive card-section animate-[fadeIn_2.7s_ease-out]"
            aria-label="Vai alla sezione Misure e Conversioni"
          >
            <div class="text-6xl text-center mb-4">📏</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Misure
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Converti le unità di misura
            </p>
          </a>

          <!-- Confronto e Ordinamento -->
          <a
            routerLink="/confronto"
            class="card card-interactive card-section animate-[fadeIn_2.9s_ease-out]"
            aria-label="Vai alla sezione Confronto e Ordinamento"
          >
            <div class="text-6xl text-center mb-4">⚖️</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Confronto
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Confronta e ordina i numeri
            </p>
          </a>

          <!-- Geometria di Base -->
          <a
            routerLink="/geometria"
            class="card card-interactive card-section animate-[fadeIn_3.1s_ease-out]"
            aria-label="Vai alla sezione Geometria di Base"
          >
            <div class="text-6xl text-center mb-4">🔺</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Geometria
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Scopri le figure geometriche
            </p>
          </a>

          <!-- Moltiplicazioni a Griglia -->
          <a
            routerLink="/moltiplicazioni-griglia"
            class="card card-interactive card-section animate-[fadeIn_3.2s_ease-out]"
            aria-label="Vai alla sezione Moltiplicazioni a Griglia"
          >
            <div class="text-6xl text-center mb-4">🟩</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Griglia ×
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Colora l&#39;area della moltiplicazione
            </p>
          </a>

          <!-- Tabelline Quiz -->
          <a
            routerLink="/tabelline-quiz"
            class="card card-interactive card-section animate-[fadeIn_3.3s_ease-out]"
            aria-label="Vai alla sezione Quiz Tabelline"
          >
            <div class="text-6xl text-center mb-4">✏️</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Quiz Tabelline
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Scrivi i risultati della tabellina
            </p>
          </a>

          <!-- Tabelline a Blocchi -->
          <a
            routerLink="/tabelline-griglia"
            class="card card-interactive card-section animate-[fadeIn_3.4s_ease-out]"
            aria-label="Vai alla sezione Tabelline a Blocchi"
          >
            <div class="text-6xl text-center mb-4">🧱</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Tabelline a Blocchi
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Visualizza le tabelline come blocchi colorati
            </p>
          </a>
        </div>

        <!-- Sezione Giochi -->
        <h2
          class="text-2xl font-bold text-center mt-12 mb-6 text-[var(--color-text-primary)] animate-[fadeIn_3.3s_ease-out]"
        >
          🎮 Giochi
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <a
            routerLink="/giochi/memory"
            class="card card-interactive card-section animate-[fadeIn_3.5s_ease-out]"
            aria-label="Vai al gioco Memory Matematico"
          >
            <div class="text-6xl text-center mb-4">🃏</div>
            <h2 class="text-2xl font-bold text-center text-[var(--color-text-primary)] mb-2">
              Memory
            </h2>
            <p class="text-center text-[var(--color-text-secondary)]">
              Abbina operazioni e risultati
            </p>
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
      :host .card-section > div:first-child {
        font-size: 2.25rem;
        margin-bottom: 0.5rem;
      }
      :host .card-section h2 {
        font-size: 1.125rem;
        line-height: 1.5rem;
      }
      :host .card-section p {
        font-size: 0.875rem;
      }
    `,
  ],
})
export class HomeComponent {}
