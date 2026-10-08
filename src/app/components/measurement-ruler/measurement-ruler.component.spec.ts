import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeasurementRulerComponent } from './measurement-ruler.component';

@Component({
  imports: [MeasurementRulerComponent],
  template: `<app-measurement-ruler [value]="value" [max]="max" unit="cm" />`,
})
class HostComponent {
  value = 30;
  max = 100;
}

describe('MeasurementRulerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('shows graduated marks and accessible value', () => {
    const ruler: HTMLElement = fixture.nativeElement.querySelector('.ruler');
    expect(ruler.getAttribute('aria-label')).toContain('30 cm');
    expect(fixture.nativeElement.querySelectorAll('.ruler__mark')).toHaveLength(6);
    expect(fixture.nativeElement.querySelector('.ruler__value').textContent).toContain('30 cm');
  });
});
