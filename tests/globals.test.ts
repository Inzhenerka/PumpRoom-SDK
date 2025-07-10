import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fullscreen from '../src/fullscreen.ts';
import { 
  setConfig, 
  getConfig, 
  setCurrentUser, 
  getCurrentUser,
  registerStates,
  getRegisteredStates,
  resetRegisteredStates
} from '../src/globals.ts';
import { init } from '../src/index.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  // Reset registered states after each test
  resetRegisteredStates();
});

describe('globals', () => {
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

  describe('state registration', () => {
    it('registers state names', () => {
      // Initially, no states are registered
      expect(getRegisteredStates()).toEqual([]);

      // Register some states
      registerStates(['state1', 'state2']);

      // Check that the states were registered
      expect(getRegisteredStates()).toEqual(['state1', 'state2']);
    });

    it('throws an error if stateNames is not an array', () => {
      // @ts-ignore - Testing runtime type checking
      expect(() => registerStates('not-an-array')).toThrow('stateNames must be an array');
    });

    it('does not add duplicate state names', () => {
      // Register some states
      registerStates(['state1', 'state2']);

      // Register the same states again plus a new one
      registerStates(['state1', 'state2', 'state3']);

      // Check that duplicates were not added
      expect(getRegisteredStates()).toEqual(['state1', 'state2', 'state3']);
    });

    it('returns a copy of registered states', () => {
      // Register some states
      registerStates(['state1', 'state2']);

      // Get the registered states
      const states = getRegisteredStates();

      // Modify the returned array
      states.push('state3');

      // Check that the original registered states were not modified
      expect(getRegisteredStates()).toEqual(['state1', 'state2']);
    });

    it('resets registered states', () => {
      // Register some states
      registerStates(['state1', 'state2']);

      // Reset the registered states
      resetRegisteredStates();

      // Check that the registered states were reset
      expect(getRegisteredStates()).toEqual([]);
    });
  });
});
