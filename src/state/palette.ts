/** The palette's vocabulary: one label per line, summoned not memorized. */
export interface Command {
  id: string;
  label: string;
  /** The right-aligned whisper in a palette row. */
  hint?: string;
}

/** The eye of the palette: no more than seven lines at a time. */
export const PALETTE_CAP = 7;

/** Substring search, modest scoring: a match at a word's start reads
 * better than one buried mid-word, and the shipped order settles ties.
 * Generic over the command type so its runs survive the filter. */
export function filterCommands<T extends Command>(commands: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands.slice(0, PALETTE_CAP);
  const scored: Array<{ cmd: T; score: number }> = [];
  for (const cmd of commands) {
    const label = cmd.label.toLowerCase();
    const at = label.indexOf(q);
    if (at === -1) continue;
    const wordStart = at === 0 || /[\s:—]/.test(label[at - 1] ?? '');
    if (wordStart) {
      scored.push({ cmd, score: 0 });
      continue;
    }
    scored.push({ cmd, score: 1 });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, PALETTE_CAP).map((s) => s.cmd);
}
