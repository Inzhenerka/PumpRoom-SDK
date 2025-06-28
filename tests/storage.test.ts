import { describe, it, expect, beforeEach } from 'vitest';
import { readCachedUser, saveCachedUser } from '../src/storage';

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
});
