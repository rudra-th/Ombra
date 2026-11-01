import { describe, expect, it, vi } from 'vitest';
import {
  ensureIconsPermission,
  faviconUrl,
  type PermissionsSeam,
} from './icons';

const seamWith = (
  contains: boolean,
  request: boolean,
): PermissionsSeam & { contains: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn> } => ({
  contains: vi.fn(async () => contains),
  request: vi.fn(async () => request),
});

describe('the favicon permission seam', () => {
  it('answers true when the grant already exists', async () => {
    const seam = seamWith(true, false);
    expect(await ensureIconsPermission(seam)).toBe(true);
    expect(seam.request).not.toHaveBeenCalled();
  });

  it('asks only when the grant is absent, and reports the answer', async () => {
    const seam = seamWith(false, true);
    expect(await ensureIconsPermission(seam)).toBe(true);
    expect(seam.request).toHaveBeenCalledTimes(1);

    const denied = seamWith(false, false);
    expect(await ensureIconsPermission(denied)).toBe(false);
  });

  it('stays quiet for pages with no permission seam at all', async () => {
    expect(await ensureIconsPermission(undefined)).toBe(false);
  });
});

describe('the favicon route', () => {
  it('encodes the page url onto the route', () => {
    expect(
      faviconUrl('https://github.com', 'chrome-extension://abc/_favicon/'),
    ).toBe('chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fgithub.com&size=32');
  });

  it('has no route to names — non-extension pages fall back', () => {
    expect(faviconUrl('https://github.com', null)).toBeNull();
  });
});
