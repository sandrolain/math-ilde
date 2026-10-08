import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NumberLineComponent } from './number-line.component';

describe('NumberLineComponent', () => {
  let fixture: ComponentFixture<NumberLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberLineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberLineComponent);
    fixture.componentRef.setInput('start', 3);
    fixture.componentRef.setInput('target', 7);
    fixture.detectChanges();
  });

  it('renders every point between start and target', () => {
    expect(fixture.nativeElement.querySelectorAll('.number-line__point')).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('3');
    expect(fixture.nativeElement.textContent).toContain('7');
  });
});
