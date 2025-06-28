import { describe, it, expect, beforeEach } from 'vitest';
import { readCachedUser, saveCachedUser } from '../src/storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('returns null when storage empty', () => {
    expect(readCachedUser()).toBeNull();
  });

  it('saves and reads user', () => {
    const user = { uid: 'u', token: 't', is_admin: false };
    saveCachedUser(user);
    expect(readCachedUser()).toEqual(user);
  });

  it('handles JSON parse error', () => {
    localStorage.setItem('pumproomUser', '{bad json');
    expect(readCachedUser()).toBeNull();
  });

  it('ignores storage failures', () => {
    const orig = global.localStorage;
    global.localStorage = {
      setItem: () => { throw new Error('fail'); },
      getItem: orig.getItem.bind(orig),
      clear: orig.clear.bind(orig),
      removeItem: orig.removeItem.bind(orig),
    } as any;
    const user = { uid: 'u', token: 't', is_admin: false };
    expect(() => saveCachedUser(user)).not.toThrow();
    global.localStorage = orig;
  });
});
