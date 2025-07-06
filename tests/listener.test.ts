import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../src/auth.js';
import { setConfig } from '../src/state.js';
import { initApiClient } from '../src/api-client.js';
import * as messaging from '../src/messaging.js';

beforeEach(() => {
  setConfig({ apiKey: 'key', realm: 'test', cacheUser: false });
  initApiClient('key');
  vi.restoreAllMocks();
});

describe('default message listener', () => {
  it('responds with current user when requested', async () => {
    const response = { uid: '1', token: 't', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });
    const spy = vi.spyOn(messaging, 'sendUser').mockImplementation(() => {});

    await authenticate({ login: 'l', name: 'n', istutor: false, lang: 'en', projectid: '1' });

    const event = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'getPumpRoomUser' },
      origin: 'https://pumproom.tech',
      source: window,
    });
    window.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][1]).toBe('https://pumproom.tech');
  });
});
