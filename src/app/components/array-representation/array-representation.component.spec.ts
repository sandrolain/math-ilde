import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArrayRepresentationComponent } from './array-representation.component';

describe('ArrayRepresentationComponent', () => {
  let fixture: ComponentFixture<ArrayRepresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArrayRepresentationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArrayRepresentationComponent);
    fixture.componentRef.setInput('rows', 3);
    fixture.componentRef.setInput('columns', 4);
    fixture.detectChanges();
  });

  it('renders one cell for each group element', () => {
    expect(fixture.nativeElement.querySelectorAll('.array-representation__cell')).toHaveLength(12);
    expect(fixture.nativeElement.textContent).toContain('3 gruppi da 4 elementi');
  });
});
