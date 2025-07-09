import { describe, it, expect, beforeEach } from 'vitest';
import { retrieveData, storeData } from '../src/storage.ts';
import {USER_STORAGE_KEY} from "../src/constants.ts";

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('returns null when storage empty', () => {
    expect(retrieveData(USER_STORAGE_KEY)).toBeNull();
  });

  it('saves and reads user', () => {
    const user = { uid: 'u', token: 't', is_admin: false };
    storeData(USER_STORAGE_KEY, user);
    expect(retrieveData(USER_STORAGE_KEY)).toEqual(user);
  });

  it('handles JSON parse error', () => {
    localStorage.setItem('pumproomUser', '{bad json');
    expect(retrieveData(USER_STORAGE_KEY)).toBeNull();
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
    expect(() => storeData(USER_STORAGE_KEY, user)).not.toThrow();
    global.localStorage = orig;
  });
});
