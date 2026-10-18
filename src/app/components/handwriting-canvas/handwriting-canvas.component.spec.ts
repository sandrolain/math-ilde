import { TestBed } from '@angular/core/testing';
import { HandwritingCanvasComponent } from './handwriting-canvas.component';

describe('HandwritingCanvasComponent', () => {
  async function create(target: string, writingStyle?: string) {
    await TestBed.configureTestingModule({
      imports: [HandwritingCanvasComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HandwritingCanvasComponent);
    fixture.componentRef.setInput('target', target);
    if (writingStyle) fixture.componentRef.setInput('writingStyle', writingStyle);
    fixture.detectChanges();
    return fixture;
  }

  it('mostra canvas, stile e comandi', async () => {
    const fixture = await create('a', 'stampatello-maiuscolo');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('canvas')).toBeTruthy();
    expect(element.textContent).toContain('Controlla');
    expect(element.textContent).toContain('Annulla');
    expect(element.textContent).toContain('Cancella');
    expect(element.textContent).toContain('Stampatello maiuscolo');
  });

  it('segnala il foglio vuoto quando non ci sono tratti', async () => {
    const fixture = await create('a');
    fixture.componentInstance.evaluate();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('foglio è vuoto');
  });

  it('usa la lettera maiuscola per gli stili maiuscoli', async () => {
    const fixture = await create('b', 'corsivo-maiuscolo');
    expect(fixture.componentInstance.displayChar()).toBe('B');
    expect(fixture.componentInstance.styleLabel()).toBe('Corsivo maiuscolo');
  });

  it('usa il font corsivo solo per gli stili corsivi', async () => {
    const fixture = await create('a', 'corsivo-minuscolo');
    expect(fixture.componentInstance.isCursive()).toBe(true);

    fixture.componentRef.setInput('writingStyle', 'stampatello-minuscolo');
    expect(fixture.componentInstance.isCursive()).toBe(false);
  });

  it('blocca lo scroll della pagina durante la scrittura su touch', async () => {
    const fixture = await create('a');
    const canvas = (fixture.nativeElement as HTMLElement).querySelector(
      'canvas',
    ) as HTMLCanvasElement;

    const touchStart = new Event('touchstart', { cancelable: true });
    canvas.dispatchEvent(touchStart);
    expect(touchStart.defaultPrevented).toBe(true);

    const touchMove = new Event('touchmove', { cancelable: true });
    canvas.dispatchEvent(touchMove);
    expect(touchMove.defaultPrevented).toBe(true);
  });

  it('azzera il foglio quando cambia la lettera o il token di reset', async () => {
    const fixture = await create('a');
    const component = fixture.componentInstance;

    component.strokes.set([[{ x: 10, y: 40 }]]);
    fixture.detectChanges();
    expect(component.strokes()).toHaveLength(1);

    fixture.componentRef.setInput('target', 'b');
    fixture.detectChanges();
    expect(component.strokes()).toHaveLength(0);

    component.strokes.set([[{ x: 10, y: 40 }]]);
    fixture.componentRef.setInput('clearToken', 1);
    fixture.detectChanges();
    expect(component.strokes()).toHaveLength(0);
  });

  it('conserva i tratti quando si rilasciano più volte', async () => {
    const fixture = await create('a');
    const component = fixture.componentInstance;
    const canvas = (fixture.nativeElement as HTMLElement).querySelector(
      'canvas',
    ) as HTMLCanvasElement;
    canvas.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 640,
        height: 400,
        right: 640,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const event = (x: number, y: number) =>
      ({ clientX: x, clientY: y, button: 0, pointerId: 1 }) as unknown as PointerEvent;

    component.onPointerDown(event(100, 100));
    component.onPointerMove(event(120, 120));
    component.onPointerUp(event(140, 140));
    fixture.detectChanges();
    expect(component.strokes()).toHaveLength(1);

    component.onPointerDown(event(160, 160));
    component.onPointerMove(event(180, 180));
    component.onPointerUp(event(200, 200));
    fixture.detectChanges();
    expect(component.strokes()).toHaveLength(2);
  });
});
