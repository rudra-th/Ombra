/**
 * The favicon permission seam. The `_favicon/` route answers only for
 * pages granted the optional `favicon` permission — contains first, ask
 * in place, and a denial stays a quiet false for the caller to shape.
 */

/** Structural slice of chrome.permissions so fakes track the real contract. */
export interface PermissionsSeam {
  contains(query: { permissions: string[] }): Promise<boolean>;
  request(query: { permissions: string[] }): Promise<boolean>;
}

interface ChromeLike {
  permissions?: PermissionsSeam;
  runtime?: {
    getURL?(path: string): string;
  };
}

const chrome = (): ChromeLike | undefined =>
  (globalThis as { chrome?: ChromeLike }).chrome;

/**
 * True when icons may load: the grant already rode an earlier ask, or the
 * user granted it just now. Never prompts twice; never throws on refusal.
 */
export async function ensureIconsPermission(
  seam: PermissionsSeam | undefined,
): Promise<boolean> {
  if (!seam) return false;
  if (await seam.contains({ permissions: ['favicon'] })) return true;
  try {
    return (await seam.request({ permissions: ['favicon'] })) === true;
  } catch {
    return false;
  }
}

/** The real route base for extension pages, or null for the broader web. */
function runtimeBase(): string | null {
  const runtime = chrome()?.runtime;
  const base =
    runtime && typeof runtime.getURL === 'function'
      ? runtime.getURL('_favicon/')
      : null;
  return base || null;
}

/** Chrome's local favicon route — no network request of ours. */
export function faviconUrl(pageUrl: string, base: string | null = runtimeBase()): string | null {
  if (!base) return null;
  return `${base}?pageUrl=${encodeURIComponent(pageUrl)}&size=32`;
}
