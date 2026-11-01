/**
 * Dev-only shim: gives wxt/storage a chrome.storage surface when the preview
 * page is opened outside the extension (file:// or web server).
 * Imported first so it installs before any wxt/browser code runs.
 */

type Change = { oldValue?: unknown; newValue?: unknown };
type Listener = (changes: Record<string, Change>, area: string) => void;

const data: Record<string, Record<string, unknown>> = {};
const listeners = new Set<Listener>();

const makeArea = (name: string) => {
  const bag = () => (data[name] ??= {});
  return {
    get: async (keys: unknown) => {
      const store = bag();
      if (keys === null || keys === undefined) {
        return { ...store };
      }
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.map((k) => [k, store[k as string]]));
      }
      if (typeof keys === 'object') {
        const obj = keys as Record<string, unknown>;
        return Object.fromEntries(
          Object.keys(obj).map((k) => [k, k in store ? store[k] : obj[k]]),
        );
      }
      return { [String(keys)]: store[String(keys)] };
    },
    getBytesInUse: async () => 0,
    set: async (values: Record<string, unknown>) => {
      const store = bag();
      const changes: Record<string, Change> = {};
      for (const [k, v] of Object.entries(values)) {
        // Real chrome.storage omits unchanged keys from change events.
        if (store[k] === v) continue;
        changes[k] = { oldValue: store[k], newValue: store[k] = v };
      }
      for (const l of listeners) l(changes, name);
    },
    remove: async (keys: string | string[]) => {
      const store = bag();
      const list = Array.isArray(keys) ? keys : [keys];
      const changes: Record<string, Change> = {};
      for (const k of list) {
        if (k in store) {
          changes[k] = { oldValue: store[k], newValue: undefined };
          delete store[k];
        }
      }
      if (Object.keys(changes).length) for (const l of listeners) l(changes, name);
    },
    clear: async () => {
      const store = bag();
      const changes: Record<string, Change> = {};
      for (const k of Object.keys(store)) {
        changes[k] = { oldValue: store[k], newValue: undefined };
      }
      data[name] = {};
      if (Object.keys(changes).length) for (const l of listeners) l(changes, name);
    },
    onChanged: {
      addListener: (l: Listener) => void listeners.add(l),
      removeListener: (l: Listener) => void listeners.delete(l),
      hasListener: (l: Listener) => listeners.has(l),
    },
    setAccessLevel: async () => undefined,
  };
};

// Some embedders ship an empty `chrome` stub — merge into it instead of replacing.
const chromeStub: Record<string, unknown> =
  typeof (globalThis as unknown as { chrome?: unknown }).chrome === 'object' &&
  (globalThis as unknown as { chrome?: null }).chrome !== null
    ? (globalThis as unknown as { chrome: Record<string, unknown> }).chrome
    : {};

const looksLikeExtension =
  (chromeStub.runtime as { id?: string } | undefined)?.id !== undefined &&
  (chromeStub.runtime as { id?: string }).id !== 'preview';

chromeStub.runtime ??= { id: 'preview' };
chromeStub.permissions ??= {
  contains: async () => true,
  request: async () => true,
};
chromeStub.topSites ??= {
  get: async () => [
    { title: 'GitHub', url: 'https://github.com/' },
    { title: 'Wikipedia', url: 'https://en.wikipedia.org/' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com/' },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
  ],
};
chromeStub.storage ??= {
  sync: makeArea('sync'),
  local: makeArea('local'),
  session: makeArea('session'),
  managed: makeArea('managed'),
  onChanged: {
    addListener: (l: Listener) => void listeners.add(l),
    removeListener: (l: Listener) => void listeners.delete(l),
    hasListener: (l: Listener) => listeners.has(l),
  },
};
(globalThis as unknown as { chrome?: unknown }).chrome = chromeStub;

/**
 * A plausible attendance week for the design pass: the spark reads as a
 * life, not a flatline. Today seeds 0 — the page's own boot gives it 1.
 */
function demoStats(today: string): Record<string, number> {
  const week: Record<string, number> = {};
  const back = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };
  const shape = [2, 5, 1, 4, 0, 3, 0]; // oldest → today
  for (let i = 0; i < shape.length; i += 1) week[back(6 - i)] = shape[i]!;
  Object.assign(week, { [today]: 0 });
  return week;
}

/**
 * Demo content for the design pass — never in a real extension runtime,
 * so the user's own data is never touched.
 */
if (!looksLikeExtension) {
  const today = (() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  })();
  data.local = {
    intention: { text: 'Finish the Ombra proposal', key: today, streak: 6, lastKey: today },
    todos: [
      { id: `${today}-a`, text: 'Draft chapter one', created: today, done: false, doneAt: null },
      { id: `${today}-b`, text: 'Reply to Mira', created: today, done: true, doneAt: today },
      { id: `${today}-c`, text: '30 minutes of reading', created: today, done: false, doneAt: null },
    ],
    links: [
      { id: 'https://github.com', label: 'GitHub', url: 'https://github.com' },
      { id: 'https://mail.proton.me', label: 'Mail', url: 'https://mail.proton.me' },
      { id: 'https://keep.google.com', label: 'Keep', url: 'https://keep.google.com' },
    ],
    notes:
      'Ideas for the week:\n— morning pages, before screens\n— the Ombra chapter on stillness',
    weather: { city: 'Pune', label: 'Maharashtra, India', latitude: 18.52, longitude: 73.86 },
    weatherCache: { temp: 26.4, code: 2, ts: Date.now() },
    stats: demoStats(today),
  };
  data.sync = { settings: { version: 1, name: 'Rudra', soundEnabled: false } };
}
