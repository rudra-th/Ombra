export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

/** One calm row — never a second scroll. */
export const LINK_CAP = 9;

const normalizeUrl = (url: string): string => {
  const s = url.trim();
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  // trailing slash is a spelling difference, not a different place
  return withScheme.replace(/(?:\/)(\?.*)?$/, '$1');
};

/** Silent no-ops: duplicates unchanged, ninth-plus links politely refused. */
export function addLink(
  links: LinkItem[],
  label: string,
  url: string,
): LinkItem[] {
  const clean = normalizeUrl(url);
  if (links.some((l) => l.url === clean)) return links;
  if (links.length >= LINK_CAP) return links;
  return [...links, { id: clean, label: label.trim() || clean, url: clean }];
}

export function removeLink(links: LinkItem[], url: string): LinkItem[] {
  return links.filter((l) => l.url !== url);
}

/** The dragged link takes the target's exact slot; anything else is a no-op. */
export function reorderLinks(
  links: LinkItem[],
  fromUrl: string,
  toUrl: string,
): LinkItem[] {
  if (fromUrl === toUrl) return links;
  const from = links.findIndex((l) => l.url === fromUrl);
  if (from === -1) return links;
  const to = links.findIndex((l) => l.url === toUrl);
  if (to === -1) return links;
  const next = [...links];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}
