import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../src/auth.js';
import { setConfig, setCurrentUser, isAutoListenerRegistered, registerAutoListener } from '../src/state.js';
import { initApiClient } from '../src/api-client.js';

// Mock the state module to control isAutoListenerRegistered
vi.mock('../src/state.js', async () => {
  const actual = await vi.importActual('../src/state.js');
  return {
    ...actual,
    isAutoListenerRegistered: vi.fn(),
    registerAutoListener: vi.fn()
  };
});

beforeEach(() => {
  setConfig({ apiKey: 'key', realm: 'test', cacheUser: false });
  initApiClient('key');
  vi.restoreAllMocks();
  // Reset current user
  setCurrentUser(null);
  // Reset the mock for isAutoListenerRegistered
  (isAutoListenerRegistered as any).mockReturnValue(false);
});

describe('message listener registration', () => {
  it('registers message listener on successful authentication', async () => {
    const user = { uid: '1', token: 't', is_admin: false };

    // Mock the API response
    global.fetch = vi.fn().mockResolvedValue({ 
      ok: true, 
      json: () => Promise.resolve(user) 
    });

    // Spy on addEventListener
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    // Authenticate to set the current user
    await authenticate({ lms: { id: 'user1', name: 'Test User' } });

    // Verify that addEventListener was called with 'message'
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

    // Verify that registerAutoListener was called
    expect(registerAutoListener).toHaveBeenCalled();
  });
});
