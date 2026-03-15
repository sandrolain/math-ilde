import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { TimesTableSelectorComponent } from '../../components/times-table-selector/times-table-selector.component';
import { TimesTableExerciseComponent } from '../../components/times-table-exercise/times-table-exercise.component';
import { TimesTableOptionsControlComponent } from '../../components/times-table-options-control/times-table-options-control.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import { TimesTableService } from '../../services/times-table.service';
import { TimesTableOptionsStorageService } from '../../services/times-table-options-storage.service';
import type {
  TimesTableOptions,
  TimesTableRow,
  TimesTableExercise,
} from '../../types/exercise.types';

const SUCCESS_MESSAGES = [
  'Bravo!',
  'Perfetto!',
  'Complimenti!',
  'Ottimo lavoro!',
  'Sei un campione!',
];

function randomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

@Component({
  selector: 'app-times-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    TimesTableSelectorComponent,
    TimesTableExerciseComponent,
    TimesTableOptionsControlComponent,
    FeedbackComponent,
  ],
  host: { class: 'block' },
  template: `
    <app-header title="Tabelline" />

    @if (exercise() === null) {
      <!-- Schermata selezione moltiplicatore -->
      <div class="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <app-times-table-selector (selected)="selectMultiplier($event)" />
      </div>
    } @else {
      <div class="flex flex-col lg:flex-row gap-4 p-4 min-h-[calc(100vh-80px)]">
        <app-times-table-options-control
          [options]="options()"
          (optionsChange)="onOptionsChange($event)"
          (changeTable)="changeTable()"
          (retry)="retry()"
        />

        <main class="flex-1 flex flex-col items-center justify-start gap-6 py-6">
          <h2 class="text-2xl font-bold text-(--color-text-primary)">
            Tabellina del {{ options().selectedMultiplier }}
          </h2>
          <p class="text-sm text-(--color-text-secondary)">
            Tocca due numeri per scambiarli di posto
          </p>

          <app-times-table-exercise
            [rows]="tableRows()"
            [currentOrder]="currentOrder()"
            [positionCorrect]="positionCorrect()"
            [isCompleted]="isCompleted()"
            (orderChange)="onOrderChange($event)"
          />
        </main>
      </div>

      <app-feedback
        [show]="isCompleted()"
        type="success"
        [message]="successMessage()"
        (next)="retry()"
        (close)="retry()"
      />
    }
  `,
})
export class TimesTableComponent implements OnInit {
  private readonly timesTableService = inject(TimesTableService);
  private readonly storageService = inject(TimesTableOptionsStorageService);

  options = signal<TimesTableOptions>(this.storageService.loadOptions());
  exercise = signal<TimesTableExercise | null>(null);
  currentOrder = signal<number[]>([]);
  positionCorrect = signal<(boolean | undefined)[]>([]);
  isCompleted = signal<boolean>(false);
  successMessage = signal<string>(randomMessage(SUCCESS_MESSAGES));

  tableRows = computed<TimesTableRow[]>(() => this.exercise()?.rows ?? []);

  ngOnInit(): void {
    // Nessuna selezione all'avvio: si parte dalla schermata di scelta
  }

  selectMultiplier(n: number): void {
    const opts = { ...this.options(), selectedMultiplier: n };
    this.options.set(opts);
    this.buildExercise(n, opts.tableLength);
  }

  onOptionsChange(newOptions: TimesTableOptions): void {
    const prevMultiplier = this.options().selectedMultiplier;
    this.options.set(newOptions);
    this.storageService.saveOptions(newOptions);

    // Se cambia la lunghezza, rigenera l'esercizio
    if (prevMultiplier !== null) {
      this.buildExercise(prevMultiplier, newOptions.tableLength);
    }
  }

  onOrderChange(newOrder: number[]): void {
    this.currentOrder.set(newOrder);
    const rows = this.tableRows();
    const correct = this.timesTableService.checkPositions(rows, newOrder);
    // Mostra feedback solo se l'utente ha mosso qualcosa rispetto all'ordine mescolato iniziale
    this.positionCorrect.set(correct);
    const completed = this.timesTableService.isCompleted(rows, newOrder);
    this.isCompleted.set(completed);
    if (completed) {
      this.successMessage.set(randomMessage(SUCCESS_MESSAGES));
    }
  }

  retry(): void {
    const rows = this.tableRows();
    const shuffled = this.timesTableService.shuffleResults(rows);
    this.currentOrder.set(shuffled);
    this.positionCorrect.set(rows.map(() => undefined));
    this.isCompleted.set(false);
  }

  changeTable(): void {
    this.exercise.set(null);
    this.currentOrder.set([]);
    this.positionCorrect.set([]);
    this.isCompleted.set(false);
    this.options.update((o) => ({ ...o, selectedMultiplier: null }));
  }

  private buildExercise(multiplier: number, length: TimesTableOptions['tableLength']): void {
    const rows = this.timesTableService.generateTable(multiplier, length);
    const shuffled = this.timesTableService.shuffleResults(rows);
    this.exercise.set({ rows, shuffledResults: shuffled });
    this.currentOrder.set(shuffled);
    this.positionCorrect.set(rows.map(() => undefined));
    this.isCompleted.set(false);
  }
}
