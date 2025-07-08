import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fullscreen from '../src/fullscreen.ts';
import { setConfig, getConfig, setCurrentUser, getCurrentUser } from '../src/state.ts';
import { init } from '../src/index.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('state', () => {
  it('initializes config', () => {
    setConfig({ apiKey: 'key', realm: 'test' });
    expect(getConfig()).toEqual({ apiKey: 'key', realm: 'test', cacheUser: true });
  });

  it('calls fullscreen handler when initialized via init', () => {
    const spy = vi.spyOn(fullscreen, 'setFullscreenListener').mockImplementation(() => {});
    init({ apiKey: 'key', realm: 'test' });
    expect(spy).toHaveBeenCalled();
  });

  it('sets and gets current user', () => {
    const user = { uid: '1', token: 't', is_admin: false };
    setCurrentUser(user);
    expect(getCurrentUser()).toEqual(user);
  });
});
