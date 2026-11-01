import { describe, expect, it } from 'vitest';
import { addLink, removeLink, reorderLinks, type LinkItem } from './store';

const link = (label: string, url: string): LinkItem => ({
  id: url,
  label,
  url,
});

describe('reorderLinks', () => {
  it('the dragged link takes the exact slot of its target', () => {
    const four = [link('A', 'a'), link('B', 'b'), link('C', 'c'), link('D', 'd')];
    expect(reorderLinks(four, 'd', 'b').map((l) => l.url)).toEqual(['a', 'd', 'b', 'c']);
    expect(reorderLinks(four, 'a', 'd').map((l) => l.url)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('leaves the row alone for self drags and strangers', () => {
    const four = [link('A', 'a'), link('B', 'b')];
    expect(reorderLinks(four, 'a', 'a')).toBe(four);
    expect(reorderLinks(four, 'x', 'a')).toBe(four);
    expect(reorderLinks(four, 'a', 'x')).toBe(four);
  });
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
