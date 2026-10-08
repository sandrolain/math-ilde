import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LearningSettingsComponent } from './learning-settings.component';

describe('LearningSettingsComponent', () => {
  let fixture: ComponentFixture<LearningSettingsComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LearningSettingsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LearningSettingsComponent);
    fixture.detectChanges();
  });

  it('shows local preference controls', () => {
    expect(fixture.nativeElement.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Reset selettivo');
  });
});
