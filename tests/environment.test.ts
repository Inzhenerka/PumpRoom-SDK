import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEnvironment, setEnvironmentListener } from '../src/environment.js';
import * as version from '../src/version.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('environment helpers', () => {
  it('sends environment data to target', () => {
    vi.spyOn(version, 'getVersion').mockReturnValue('1.0.0');
    const target = { postMessage: vi.fn() } as unknown as Window;
    sendEnvironment(target, 'https://pumproom.tech');
    expect(target.postMessage).toHaveBeenCalledWith(
      {
        service: 'pumproom',
        type: 'setEnvironment',
        payload: { pageURL: window.location.href, sdkVersion: '1.0.0' }
      },
      'https://pumproom.tech'
    );
  });

  it('responds to getEnvironment message', () => {
    vi.spyOn(version, 'getVersion').mockReturnValue('2.0.0');
    const postSpy = vi.spyOn(window, 'postMessage');
    setEnvironmentListener();
    const event = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'getEnvironment' },
      origin: 'https://pumproom.tech',
      source: window
    });
    window.dispatchEvent(event);

    expect(postSpy).toHaveBeenCalledWith(
      {
        service: 'pumproom',
        type: 'setEnvironment',
        payload: { pageURL: window.location.href, sdkVersion: '2.0.0' }
      },
      'https://pumproom.tech'
    );
  });
});
