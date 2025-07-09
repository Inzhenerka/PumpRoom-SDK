import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setUser } from '../src/auth.ts';
import { setConfig, getCurrentUser, setCurrentUser } from '../src/globals.ts';
import { initApiClient } from '../src/api-client.ts';
import { VERIFY_URL } from '../src/constants.ts';

beforeEach(() => {
  setConfig({ apiKey: 'key', realm: 'test' });
  initApiClient('key');
  localStorage.clear();
  vi.restoreAllMocks();
  setCurrentUser(null);
});

describe('setUser', () => {
  it('verifies and stores user', async () => {
    const verifyResp = { is_valid: true, is_admin: true };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = { uid: '1', token: 'tok' };
    const result = await setUser(user);

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(result).toEqual({ uid: '1', token: 'tok', is_admin: true });
    expect(getCurrentUser()).toEqual({ uid: '1', token: 'tok', is_admin: true });
    expect(localStorage.getItem('pumproomUser')).not.toBeNull();
  });

  it('returns null and logs error on invalid user', async () => {
    const verifyResp = { is_valid: false, is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const removeSpy = vi.spyOn(localStorage, 'removeItem');

    const result = await setUser({ uid: '2', token: 'bad' });

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(err).toHaveBeenCalled();
    expect(result).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(removeSpy).not.toHaveBeenCalled();
  });
});
