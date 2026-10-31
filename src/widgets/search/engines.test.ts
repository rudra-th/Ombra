import { describe, expect, it } from 'vitest';
import { ENGINE_LIST, buildSearchUrl, toDirectUrl } from './engines';

describe('ENGINE_LIST', () => {
  it('has a clear default and carries the calm engines', () => {
    expect(ENGINE_LIST.map((e) => e.id)).toContain('google');
    expect(ENGINE_LIST.map((e) => e.id)).toContain('duckduckgo');
    expect(ENGINE_LIST.map((e) => e.id)).toContain('perplexity');
  });

  it('declares exactly one default', () => {
    expect(ENGINE_LIST.filter((e) => e.isDefault)).toHaveLength(1);
  });
});

describe('buildSearchUrl', () => {
  it('encodes the query into each engine template', () => {
    expect(buildSearchUrl('duckduckgo', 'zen tab')).toBe(
      'https://duckduckgo.com/?q=zen%20tab',
    );
    expect(buildSearchUrl('google', "chi's shadow")).toBe(
      'https://www.google.com/search?q=chi%27s%20shadow',
    );
    expect(buildSearchUrl('perplexity', 'weather now')).toBe(
      'https://www.perplexity.ai/search?q=weather%20now',
    );
  });

  it('falls back to the default engine for an unknown id', () => {
    const unknown = buildSearchUrl('nope', 'q');
    expect(unknown).toBe(buildSearchUrl('duckduckgo', 'q'));
  });
});

describe('toDirectUrl', () => {
  it('recognizes bare domains and adds the scheme', () => {
    expect(toDirectUrl('wikipedia.org')).toBe('https://wikipedia.org');
    expect(toDirectUrl('github.com/rudra-th')).toBe(
      'https://github.com/rudra-th',
    );
  });

  it('passes through full urls untouched', () => {
    expect(toDirectUrl('https://example.org/a?b=1')).toBe(
      'https://example.org/a?b=1',
    );
  });

  it('refuses plain words', () => {
    expect(toDirectUrl('zen new tab')).toBeNull();
    expect(toDirectUrl('how to calm')).toBeNull();
  });
});
