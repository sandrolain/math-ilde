import { HintService } from './hint.service';
import type { MathOperation } from '../types/exercise.types';

describe('HintService', () => {
  const addition: MathOperation = {
    operand1: 3,
    operator: '+',
    operand2: 2,
    result: 5,
  };
  const subtraction: MathOperation = {
    operand1: 7,
    operator: '-',
    operand2: 3,
    result: 4,
  };

  it('maps attempts to progressive hint levels', () => {
    const service = new HintService();

    expect(service.getLevel(0)).toBe(1);
    expect(service.getLevel(1)).toBe(1);
    expect(service.getLevel(2)).toBe(2);
    expect(service.getLevel(3)).toBe(3);
    expect(service.getLevel(10)).toBe(3);
  });

  it('gives progressively more actionable addition hints', () => {
    const service = new HintService();

    expect(service.getHint(addition, 0)).toContain('gruppi');
    expect(service.getHint(addition, 2)).toContain('aggiungi');
    expect(service.getHint(addition, 3)).toContain('passi avanti');
  });

  it('gives progressively more actionable subtraction hints', () => {
    const service = new HintService();

    expect(service.getHint(subtraction, 0)).toContain('barrati');
    expect(service.getHint(subtraction, 2)).toContain('togli');
    expect(service.getHint(subtraction, 3)).toContain('7');
  });
});
