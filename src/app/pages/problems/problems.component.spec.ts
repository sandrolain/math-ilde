import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProblemsComponent } from './problems.component';

describe('ProblemsComponent', () => {
  let fixture: ComponentFixture<ProblemsComponent>;
  let component: ProblemsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProblemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('encourages child to fill answer before checking', () => {
    component.checkAnswer();

    expect(component.feedback()).toContain('Inserisci');
  });
});
