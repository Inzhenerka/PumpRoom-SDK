import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fullscreen from '../src/fullscreen.js';
import { setConfig, getConfig, setCurrentUser, getCurrentUser } from '../src/state.js';
import { init } from '../src/index.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('state', () => {
  it('initializes config', () => {
    setConfig({ apiKey: 'key', realm: 'test' });
    expect(getConfig()).toEqual({ apiKey: 'key', realm: 'test', cacheUser: true });
  });

  it('calls fullscreen handler when initialized via init', () => {
    const spy = vi.spyOn(fullscreen, 'handleFullscreenToggle').mockImplementation(() => {});
    init({ apiKey: 'key', realm: 'test' });
    expect(spy).toHaveBeenCalled();
  });

  it('sets and gets current user', () => {
    const user = { uid: '1', token: 't', is_admin: false };
    setCurrentUser(user);
    expect(getCurrentUser()).toEqual(user);
  });
});
