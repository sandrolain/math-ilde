import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LearningPathsComponent } from './learning-paths.component';

describe('LearningPathsComponent', () => {
  let fixture: ComponentFixture<LearningPathsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningPathsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningPathsComponent);
    fixture.detectChanges();
  });

  it('renders guided learning paths', () => {
    expect(fixture.nativeElement.querySelectorAll('.path-row')).toHaveLength(4);
  });
});
