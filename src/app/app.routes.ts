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
    path: '**',
    redirectTo: '',
  },
];
