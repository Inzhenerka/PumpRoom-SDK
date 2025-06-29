import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendUser } from '../src/messaging.js';
import { setCurrentUser } from '../src/state.js';

beforeEach(() => {
  setCurrentUser(null);
});

describe('messaging', () => {

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
