import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SyllablesComponent } from './syllables.component';

describe('SyllablesComponent', () => {
  let fixture: ComponentFixture<SyllablesComponent>;
  let component: SyllablesComponent;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SyllablesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SyllablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('azzera la lettera quando cambiano le impostazioni laterali in modalità scrittura', () => {
    component.onOptionsChange({ ...component.options(), activeMode: 'handwriting' });
    const tokenAllaEntrata = component.handwritingClear();

    component.onOptionsChange({ ...component.options(), handwritingStyle: 'corsivo-maiuscolo' });

    expect(component.handwritingClear()).toBeGreaterThan(tokenAllaEntrata);
  });

  it('azzera la lettera quando cambia il filtro delle lettere in modalità scrittura', () => {
    component.onOptionsChange({ ...component.options(), activeMode: 'handwriting' });
    const tokenAllaEntrata = component.handwritingClear();

    component.onOptionsChange({ ...component.options(), letterFilter: 'vowels' });

    expect(component.handwritingClear()).toBeGreaterThan(tokenAllaEntrata);
    expect('aeiou').toContain(component.currentLetter());
  });

  it('in modalità traguardo sceglie solo lettere non ancora superate', () => {
    component.onOptionsChange({
      ...component.options(),
      activeMode: 'handwriting',
      handwritingMilestone: true,
    });
    component.handwritingPassed.set(component.alphabet.filter((letter) => letter !== 'q'));

    component.generateNext();

    expect(component.currentLetter()).toBe('q');
  });

  it('segna la lettera come superata dopo una verifica corretta', () => {
    component.onOptionsChange({
      ...component.options(),
      activeMode: 'handwriting',
      handwritingMilestone: true,
    });
    component.currentRawContent.set('m');

    component.onHandwritingResult(true);

    expect(component.isHandwritingLetterPassed('m')).toBe(true);
    expect(component.handwritingPassed()).toContain('m');
  });
});
