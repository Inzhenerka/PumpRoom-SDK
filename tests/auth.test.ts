import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate, setUser } from '../src/auth.ts';
import { setConfig, getCurrentUser, isAutoListenerRegistered, registerAutoListener, setCurrentUser } from '../src/globals.ts';
import { AUTH_URL, VERIFY_URL } from '../src/constants.ts';
import { getPumpRoomEventMessage } from '../src/messaging.ts';

import { setupSdk } from './test-utils.ts';

beforeEach(() => {
  setupSdk();
});

describe('authenticate', () => {
  it('requests auth endpoint', async () => {
    const response = { uid: '1', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    const user = await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(user).toEqual(response);
    expect(getCurrentUser()).toEqual(response);
  });

  it('uses cached user when verified', async () => {
    setConfig({ apiKey: 'key', realm: 'test', cacheUser: true });
    const cached = { uid: '2', token: 'cached', is_admin: true };
    localStorage.setItem('pumproomUser', JSON.stringify(cached));

    const verifyResp = { is_valid: true, is_admin: true };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(user).toEqual(cached);
  });

  it('clears invalid cached user', async () => {
    setConfig({ apiKey: 'key', realm: 'test', cacheUser: true });
    const cached = { uid: '3', token: 'bad', is_admin: false };
    localStorage.setItem('pumproomUser', JSON.stringify(cached));

    const verifyResp = { is_valid: false, is_admin: false };
    const authResp = { uid: '3', token: 'new', is_admin: false };
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(verifyResp) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(authResp) });

    const user = await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    expect(localStorage.getItem('pumproomUser')).not.toContain('bad');
    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(user).toEqual(authResp);
  });

  it('throws on auth error', async () => {
    setConfig({ apiKey: 'key', realm: 'test', cacheUser: false });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'fail' });

    await expect(
      authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' })
    ).rejects.toThrow('Authentication error');
    expect(getCurrentUser()).toBeNull();
  });

  it('uses email as id when id is missing', async () => {
    const response = { uid: '4', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    await authenticate({ lms: { email: 'test@example.com', name: 'User' } });

    const call = (fetch as unknown as vi.Mock).mock.calls[0][1];
    expect(call.body).toContain('"id":"test@example.com"');
  });

  it('warns when both id and email provided', async () => {
    const response = { uid: '5', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await authenticate({ lms: { id: '10', email: 'foo@bar.com', name: 'U' } });

    expect(warn).toHaveBeenCalled();
    const call = (fetch as unknown as vi.Mock).mock.calls[0][1];
    expect(call.body).toContain('"id":"10"');
  });
});

describe('setUser', () => {
  it('verifies and sets a user with valid token', async () => {
    const userInput = { uid: '123', token: 'valid-token' };
    const verifyResp = { is_valid: true, is_admin: true };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = await setUser(userInput);

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(user).toEqual({ ...userInput, is_admin: true });
    expect(getCurrentUser()).toEqual({ ...userInput, is_admin: true });
  });

  it('returns null when token verification fails', async () => {
    const userInput = { uid: '123', token: 'invalid-token' };
    const verifyResp = { is_valid: false, is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = await setUser(userInput);

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(user).toBeNull();
  });

  it('returns null when verification request fails', async () => {
    const userInput = { uid: '123', token: 'token' };
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = await setUser(userInput);

    expect(errorSpy).toHaveBeenCalled();
    expect(user).toBeNull();
  });

  it('caches user when cacheUser is enabled', async () => {
    setConfig({ apiKey: 'key', realm: 'test', cacheUser: true });
    const userInput = { uid: '123', token: 'valid-token' };
    const verifyResp = { is_valid: true, is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    await setUser(userInput);

    const cachedUser = JSON.parse(localStorage.getItem('pumproomUser') || '{}');
    expect(cachedUser).toEqual({ ...userInput, is_admin: false });
  });
});

describe('email validation', () => {
  it('accepts valid email formats', async () => {
    const response = { uid: '6', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    await authenticate({ lms: { email: 'user@example.com', name: 'User' } });

    const call = (fetch as unknown as vi.Mock).mock.calls[0][1];
    expect(call.body).toContain('"id":"user@example.com"');
  });

  it('warns about invalid email format', async () => {
    const response = { uid: '7', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await authenticate({ lms: { email: 'invalid-email', name: 'User' } });

    expect(warn).toHaveBeenCalled();
    const call = (fetch as unknown as vi.Mock).mock.calls[0][1];
    expect(call.body).not.toContain('"id":"invalid-email"');
  });
});


describe('default user listener', () => {
  it('responds to getPumpRoomUser messages', async () => {
    const response = { uid: '9', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    await authenticate({ lms: { id: 'u', name: 'User' } });

    const postSpy = vi.spyOn(window, 'postMessage');
    const event = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'getPumpRoomUser' },
      origin: 'https://pumproom.tech',
      source: window
    });

    window.dispatchEvent(event);

    expect(postSpy).toHaveBeenCalledWith(
      {
        service: 'pumproom',
        type: 'setPumpRoomUser',
        payload: response
      },
      'https://pumproom.tech'
    );
  });

  it('does nothing when current user is null', async () => {
    const verifyResp = { is_valid: true, is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    await setUser({ uid: '1', token: 't' });
    setCurrentUser(null);

    const postSpy = vi.spyOn(window, 'postMessage');
    const event = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'getPumpRoomUser' },
      origin: 'https://pumproom.tech',
      source: window
    });

    window.dispatchEvent(event);

    expect(postSpy).not.toHaveBeenCalled();
  });
});

// Additional tests for user message handling would go here
// These tests are simplified to avoid mocking issues

describe('error handling in authentication', () => {
  it('handles API errors during verification', async () => {
    setConfig({ apiKey: 'key', realm: 'test', cacheUser: true });
    const user = { uid: '11', token: 'token', is_admin: false };
    localStorage.setItem('pumproomUser', JSON.stringify(user));

    // Mock fetch to throw an error
    global.fetch = vi.fn().mockRejectedValue(new Error('API error'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(authenticate()).rejects.toThrow('API error');
    expect(errorSpy).toHaveBeenCalled();
  });
});
