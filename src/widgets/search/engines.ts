export interface SearchEngine {
  id: string;
  label: string;
  /** URL template with a `{q}` placeholder for the encoded query. */
  template: string;
  isDefault?: boolean;
}

export const ENGINE_LIST: SearchEngine[] = [
  {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    template: 'https://duckduckgo.com/?q={q}',
    isDefault: true,
  },
  {
    id: 'google',
    label: 'Google',
    template: 'https://www.google.com/search?q={q}',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    template: 'https://www.perplexity.ai/search?q={q}',
  },
  {
    id: 'wikipedia',
    label: 'Wikipedia',
    template: 'https://en.wikipedia.org/w/index.php?search={q}',
  },
  {
    id: 'github',
    label: 'GitHub',
    template: 'https://github.com/search?q={q}',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    template: 'https://www.youtube.com/results?search_query={q}',
  },
];

const defaultEngine = (): SearchEngine =>
  ENGINE_LIST.find((e) => e.isDefault) ?? ENGINE_LIST[0];

/** RFC 3986: encodes the five marks `encodeURIComponent` leaves behind. */
const strictEncode = (query: string) =>
  encodeURIComponent(query).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

export function buildSearchUrl(engineId: string, query: string): string {
  const engine =
    ENGINE_LIST.find((e) => e.id === engineId) ?? defaultEngine();
  return engine.template.replace('{q}', strictEncode(query));
}

const HAS_SCHEME = /^https?:\/\//i;
/** One word with a dot in it — domains, or a domain plus path/query. */
const DOMAINISH =
  /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+([/?#].*)?$/i;

/** Naked words stay search; domains and urls open directly. */
export function toDirectUrl(input: string): string | null {
  const s = input.trim();
  if (!s || /\s/.test(s)) return null;
  if (HAS_SCHEME.test(s)) return s;
  return DOMAINISH.test(s) ? `https://${s}` : null;
}
