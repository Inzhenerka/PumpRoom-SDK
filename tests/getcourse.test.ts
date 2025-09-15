import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../src/auth.ts';
import { AUTH_URL } from '../src/constants.ts';
import { setupSdk } from './test-utils.ts';

// Message used by the validator inside authenticate()
const ALERT_MSG = 'Некорректный идентификатор пользователя из GetCourse. При встраивании JavaScript-кода включите галочку «Заменять переменные пользователя».';

beforeEach(() => {
  setupSdk(false, 'getcourse');
});

describe('GetCourse UID validation', () => {
  it('alerts and throws when id contains curly braces', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    // Ensure no network call happens
    global.fetch = vi.fn();

    await expect(
      authenticate({ lms: { id: '{user_id}', name: 'User' } })
    ).rejects.toThrow('GetCourse UID validation failed');

    expect(alertSpy).toHaveBeenCalledWith(ALERT_MSG);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('alerts and throws when id is missing', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    global.fetch = vi.fn();

    await expect(
      // id omitted entirely
      authenticate({ lms: { name: 'User' } as any })
    ).rejects.toThrow('GetCourse UID validation failed');

    expect(alertSpy).toHaveBeenCalledWith(ALERT_MSG);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('proceeds to authenticate when id is valid', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const response = { uid: 'ok', token: 'tok', is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    const user = await authenticate({ lms: { id: '12345', name: 'User' } });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(user).toEqual(response);
  });
});
