export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

/** One calm row — never a second scroll. */
export const LINK_CAP = 9;

const normalizeUrl = (url: string): string => {
  const s = url.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
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
