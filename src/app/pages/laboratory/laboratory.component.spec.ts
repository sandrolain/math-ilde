import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LaboratoryComponent } from './laboratory.component';

describe('LaboratoryComponent', () => {
  let fixture: ComponentFixture<LaboratoryComponent>;
  let component: LaboratoryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaboratoryComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LaboratoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('updates explored shape and its facts', () => {
    component.selectShape(6);
    fixture.detectChanges();
    expect(component.shapeDescription()).toContain('Esagono');
    expect(fixture.nativeElement.querySelectorAll('.shape-choice')).toHaveLength(5);
    expect(fixture.nativeElement.querySelector('.shape-description').textContent).toContain('6 lati');
  });
});
