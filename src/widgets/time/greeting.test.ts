import { describe, expect, it } from 'vitest';
import { formatClock, greeting, greetingBand } from './greeting';

describe('greetingBand', () => {
  it('draws the four bands of the day', () => {
    expect(greetingBand(5)).toBe('morning');
    expect(greetingBand(11)).toBe('morning');
    expect(greetingBand(12)).toBe('afternoon');
    expect(greetingBand(16)).toBe('afternoon');
    expect(greetingBand(17)).toBe('evening');
    expect(greetingBand(21)).toBe('evening');
    expect(greetingBand(22)).toBe('night');
    expect(greetingBand(4)).toBe('night');
  });
});

describe('greeting', () => {
  it('greets a stranger plainly', () => {
    expect(greeting(9)).toBe('Good morning.');
    expect(greeting(14)).toBe('Good afternoon.');
    expect(greeting(19)).toBe('Good evening.');
    expect(greeting(2)).toBe('Up late.');
  });

  it('greets a named user warmly, still one line', () => {
    expect(greeting(19, 'Rudra')).toBe('Good evening, Rudra.');
    expect(greeting(2, 'Rudra')).toBe('Up late, Rudra.');
  });

  it('ignores a blank name as a stranger', () => {
    expect(greeting(9, '   ')).toBe('Good morning.');
  });
});

describe('formatClock', () => {
  it('pads hours and minutes into two digits', () => {
    expect(formatClock(new Date(2026, 0, 1, 7, 3))).toBe('07:03');
    expect(formatClock(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
    expect(formatClock(new Date(2026, 0, 1, 0, 0))).toBe('00:00');
  });
});
