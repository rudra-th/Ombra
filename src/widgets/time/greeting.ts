export type Band = 'morning' | 'afternoon' | 'evening' | 'night';

const LINES: Record<Band, string> = {
  morning: 'Good morning.',
  afternoon: 'Good afternoon.',
  evening: 'Good evening.',
  night: 'Up late.',
};

export function greetingBand(hour: number): Band {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function greeting(hour: number, name?: string): string {
  const base = LINES[greetingBand(hour)];
  const trimmed = name?.trim();
  return trimmed ? `${base.slice(0, -1)}, ${trimmed}.` : base;
}

export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}
