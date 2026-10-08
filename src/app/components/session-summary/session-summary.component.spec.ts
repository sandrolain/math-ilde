import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionSummaryComponent } from './session-summary.component';
import type { ExerciseSession } from '../../types/learning.types';

describe('SessionSummaryComponent', () => {
  let fixture: ComponentFixture<SessionSummaryComponent>;
  let component: SessionSummaryComponent;

  const session: ExerciseSession = {
    id: 'session-1',
    skillId: 'addition-subtraction',
    targetExercises: 10,
    attempts: [],
    completedExercises: 8,
    correctAnswers: 9,
    startedAt: 1,
    completedAt: 2,
    status: 'completed',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('session', session);
    fixture.detectChanges();
  });

  it('renders session results', () => {
    expect(fixture.nativeElement.textContent).toContain('8 di 10');
    expect(fixture.nativeElement.textContent).toContain('9');
  });

  it('emits restart when user starts a new session', () => {
    const restartSpy = vi.fn();
    component.restart.subscribe(restartSpy);

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(restartSpy).toHaveBeenCalledOnce();
  });
});
