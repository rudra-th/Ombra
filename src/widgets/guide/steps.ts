/** The shadow's script — one quiet stop per thing the stage can't say. */
export interface TourStep {
  /** `[data-tour="x"]` hook target, or null for a centered, targetless stop. */
  target: string | null;
  title: string;
  line: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="clock"]',
    title: 'It knows the hour',
    line: 'The greeting answers the clock and the name you gave it.',
  },
  {
    target: '[data-tour="search"]',
    title: 'One bar, no boxes',
    line: 'Type to ask anything — the answer opens where it belongs.',
  },
  {
    target: '[data-tour="quote"]',
    title: 'A thought, then your rhythm',
    line: 'The quote turns each day; the strip below waits to be invited.',
  },
  {
    target: '[data-tour="side"]',
    title: 'The day, kept quietly',
    line: 'Intention, todos, notes, weather, sound, breath, focus — each is yours to ignore.',
  },
  {
    target: '[data-tour="links"]',
    title: 'Your own doors',
    line: 'A row you build by hand or from top sites — nine wide at most.',
  },
  {
    target: null,
    title: 'The darks are summoned',
    line: 'Shift+S calls the film · Ctrl+Shift+P asks the palette · double Esc is pure zen.',
  },
];
