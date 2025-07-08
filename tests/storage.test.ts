import { describe, it, expect, beforeEach } from 'vitest';
import { retrieveData, storeData } from '../src/storage.ts';
import {userStorageKey} from "../src/constants.ts";

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('returns null when storage empty', () => {
    expect(retrieveData(userStorageKey)).toBeNull();
  });

  it('saves and reads user', () => {
    const user = { uid: 'u', token: 't', is_admin: false };
    storeData(userStorageKey, user);
    expect(retrieveData(userStorageKey)).toEqual(user);
  });

  it('handles JSON parse error', () => {
    localStorage.setItem('pumproomUser', '{bad json');
    expect(retrieveData(userStorageKey)).toBeNull();
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
    expect(() => storeData(userStorageKey, user)).not.toThrow();
    global.localStorage = orig;
  });
});
