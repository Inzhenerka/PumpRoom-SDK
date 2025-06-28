import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAllowedOrigin, sendUser } from '../src/messaging';
import { setCurrentUser } from '../src/state';

beforeEach(() => {
  setCurrentUser(null);
});

describe('messaging', () => {
  it('validates origin', () => {
    expect(isAllowedOrigin('https://pumproom.tech')).toBe(true);
    expect(isAllowedOrigin('https://evil.com')).toBe(false);
  });

  it('sends user to target window', () => {
    const target = { postMessage: vi.fn() } as unknown as Window;
    const user = { uid: '1', token: 't', is_admin: false };
    setCurrentUser(user);
    sendUser(target, 'https://pumproom.tech');
    expect(target.postMessage).toHaveBeenCalledWith(
      { service: 'pumproom', type: 'setPumpRoomUser', payload: user },
      'https://pumproom.tech'
    );
  });
});
