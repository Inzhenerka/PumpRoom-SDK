import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../src/auth';
import { init, getCurrentUser } from '../src/state';
import { setCurrentUser } from '../src/state';
import { AUTH_URL, VERIFY_URL } from '../src/constants';

beforeEach(() => {
  init({ apiKey: 'key', realm: 'test' });
  localStorage.clear();
  vi.restoreAllMocks();
  setCurrentUser(null);
});

describe('authenticate', () => {
  it('requests auth endpoint', async () => {
    const response = { uid: '1', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    const user = await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(user).toEqual(response);
    expect(getCurrentUser()).toEqual(response);
  });

  it('uses cached user when verified', async () => {
    const cached = { uid: '2', token: 'cached', is_admin: true };
    localStorage.setItem('pumproomUser', JSON.stringify(cached));

    const verifyResp = { is_valid: true, is_admin: true };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(user).toEqual(cached);
  });

  it('clears invalid cached user', async () => {
    const cached = { uid: '3', token: 'bad', is_admin: false };
    localStorage.setItem('pumproomUser', JSON.stringify(cached));

    const verifyResp = { is_valid: false, is_admin: false };
    const authResp = { uid: '3', token: 'new', is_admin: false };
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(verifyResp) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(authResp) });

    const user = await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    expect(localStorage.getItem('pumproomUser')).not.toContain('bad');
    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(user).toEqual(authResp);
  });

  it('returns null on auth error', async () => {
    init({ apiKey: 'key', realm: 'test', cacheUser: false });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const user = await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    expect(user).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });
});
