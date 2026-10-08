import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenFrameComponent } from './ten-frame.component';

describe('TenFrameComponent', () => {
  let fixture: ComponentFixture<TenFrameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenFrameComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TenFrameComponent);
    fixture.componentRef.setInput('filled', 6);
    fixture.detectChanges();
  });

  it('renders ten cells and marks filled cells', () => {
    expect(fixture.nativeElement.querySelectorAll('.ten-frame__cell')).toHaveLength(10);
    expect(fixture.nativeElement.querySelectorAll('.ten-frame__cell--filled')).toHaveLength(6);
  });
});
