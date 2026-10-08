import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProgressComponent } from './progress.component';

describe('ProgressComponent', () => {
  let fixture: ComponentFixture<ProgressComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ProgressComponent);
    fixture.detectChanges();
  });

  it('shows empty diary and milestone goals', () => {
    expect(fixture.nativeElement.textContent).toContain('0esercizi risolti');
    expect(fixture.nativeElement.querySelectorAll('.milestone')).toHaveLength(3);
  });
});
