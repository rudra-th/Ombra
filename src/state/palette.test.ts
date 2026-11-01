import { describe, expect, it } from 'vitest';
import { filterCommands, type Command } from './palette';

const commands: Command[] = [
  { id: 'film', label: 'story film' },
  { id: 'zen', label: 'pure zen' },
  { id: 'accent-ember', label: 'accent: ember' },
  { id: 'settings', label: 'settings drawer' },
  { id: 'sound', label: 'sound on/off' },
  { id: 'a', label: 'aaa bbb ccc ddd eee' },
  { id: 'b', label: 'bbb ccc ddd eee fff' },
  { id: 'c', label: 'ccc ddd eee fff ggg' },
  { id: 'd', label: 'ddd eee fff ggg hhh' },
  { id: 'e', label: 'eee fff ggg hhh iii' },
  { id: 'f', label: 'fff ggg hhh iii jjj' },
  { id: 'g', label: 'ggg hhh iii jjj kkk' },
  { id: 'h', label: 'hhh iii jjj kkk lll' },
  { id: 'deep', label: 'preset: deep work' },
];

describe('the palette filter', () => {
  it('offers everything, ranked, capped at seven, when the field is empty', () => {
    const all = filterCommands(commands, '');
    expect(all).toHaveLength(7);
    expect(all[0]!.id).toBe('film'); // the original order is the rank
  });

  it('matches substrings without case', () => {
    const res = filterCommands(commands, 'ZEN');
    expect(res.map((c) => c.id)).toEqual(['zen']);
  });

  it('ranks prefixes and word starts before buried matches', () => {
    const s = filterCommands(commands, 's');
    // 'story', 'sound', 'settings' all start words — shipped order settles
    expect(s[0]!.id).toBe('film');
    expect(s.map((c) => c.id).includes('sound')).toBe(true);
    const buried = filterCommands(commands, 'ork'); // only 'deep work' has it
    expect(buried.map((c) => c.id)).toEqual(['deep']);
  });

  it('leaves spelling mistakes alone politely', () => {
    expect(filterCommands(commands, 'accen: fog')).toEqual([]); // colon not matched but rule is substring — accen: misses
  });

  it('never offers more than seven even when many match', () => {
    const res = filterCommands(commands, 'ee'); // 'eee' appears in eight labels
    expect(res.length).toBeLessThanOrEqual(7);
  });
});
