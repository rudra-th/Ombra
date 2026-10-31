import { describe, expect, it } from 'vitest';
import { addLink, removeLink, type LinkItem } from './store';

const link = (label: string, url: string): LinkItem => ({
  id: url,
  label,
  url,
});

describe('addLink', () => {
  it('normalizes bare urls to https', () => {
    const res = addLink([], 'GitHub', 'github.com');
    expect(res[0]?.url).toBe('https://github.com');
  });

  it('refuses duplicates of the same url', () => {
    const base = addLink([], 'GitHub', 'github.com/rudra-th');
    expect(addLink(base, 'GitHub again', 'https://github.com/rudra-th')).toEqual(
      base,
    );
  });

  it('caps the row at nine links', () => {
    let links: LinkItem[] = [];
    for (let i = 0; i < 11; i++) {
      links = addLink(links, `t${i}`, `https://example.org/${i}`);
    }
    expect(links).toHaveLength(9);
  });
});

describe('removeLink', () => {
  it('drops exactly the one link', () => {
    let links = addLink([], 'One', 'https://one.org');
    links = addLink(links, 'Two', 'https://two.org');
    const res = removeLink(links, 'https://one.org');
    expect(res.map((l) => l.label)).toEqual(['Two']);
  });
});
