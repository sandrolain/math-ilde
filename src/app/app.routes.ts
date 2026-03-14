import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'addizioni-sottrazioni',
    loadComponent: () =>
      import('./pages/addition-subtraction/addition-subtraction.component').then(
        (m) => m.AdditionSubtractionComponent,
      ),
  },
  {
    path: 'moltiplicazioni',
    loadComponent: () =>
      import('./pages/multiplication/multiplication.component').then(
        (m) => m.MultiplicationComponent,
      ),
  },
  {
    path: 'divisioni',
    loadComponent: () =>
      import('./pages/division/division.component').then((m) => m.DivisionComponent),
  },
  {
    path: 'scomposizione',
    loadComponent: () =>
      import('./pages/decomposition/decomposition.component').then((m) => m.DecompositionComponent),
  },
  {
    path: 'sillabe',
    loadComponent: () =>
      import('./pages/syllables/syllables.component').then((m) => m.SyllablesComponent),
  },
  {
    path: 'tabelline',
    loadComponent: () =>
      import('./pages/times-table/times-table.component').then((m) => m.TimesTableComponent),
  },
  {
    path: 'sequenze',
    loadComponent: () =>
      import('./pages/sequences/sequences.component').then((m) => m.SequencesComponent),
  },
  {
    path: 'frazioni',
    loadComponent: () =>
      import('./pages/fractions/fractions.component').then((m) => m.FractionsComponent),
  },
  {
    path: 'orologio',
    loadComponent: () => import('./pages/clock/clock.component').then((m) => m.ClockComponent),
  },
  {
    path: 'misure',
    loadComponent: () =>
      import('./pages/measurement/measurement.component').then((m) => m.MeasurementComponent),
  },
  {
    path: 'confronto',
    loadComponent: () =>
      import('./pages/comparison/comparison.component').then((m) => m.ComparisonComponent),
  },
  {
    path: 'geometria',
    loadComponent: () =>
      import('./pages/geometry/geometry.component').then((m) => m.GeometryComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
