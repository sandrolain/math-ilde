import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReviewComponent } from './review.component';
import { LearningProgressStorageService } from '../../services/learning-progress-storage.service';

describe('ReviewComponent', () => {
  let fixture: ComponentFixture<ReviewComponent>;

  beforeEach(async () => {
    const storage = new LearningProgressStorageService();
    storage.clear();

    await TestBed.configureTestingModule({
      imports: [ReviewComponent],
      providers: [LearningProgressStorageService, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewComponent);
    fixture.detectChanges();
  });

  it('shows empty review state without errors', () => {
    expect(fixture.nativeElement.textContent).toContain('Nessun ripasso urgente');
  });
});
