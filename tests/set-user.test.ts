import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setUser } from '../src/auth.ts';
import { getCurrentUser, setConfig } from '../src/globals.ts';
import { VERIFY_URL } from '../src/constants.ts';
import { setupSdk, mockUser } from './test-utils.ts';

beforeEach(() => {
  setupSdk();
});

describe('setUser', () => {
  it('verifies and stores user', async () => {
    // enable caching
    setConfig({ apiKey: 'key', realm: 'test', cacheUser: true });
    const verifyResp = { is_valid: true, is_admin: true };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const result = await setUser({ uid: mockUser.uid, token: mockUser.token });

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(result).toEqual({ uid: mockUser.uid, token: mockUser.token, is_admin: true });
    expect(getCurrentUser()).toEqual({ uid: mockUser.uid, token: mockUser.token, is_admin: true });
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
