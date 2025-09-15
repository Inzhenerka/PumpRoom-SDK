import {vi} from 'vitest';
import {setConfig, setCurrentUser} from '../src/globals.ts';
import {initApiClient} from '../src/api-client.ts';

export const mockUser = {uid: '1', token: 't', is_admin: false};

export function setupSdk(cacheUser = false, type?: 'getcourse'): void {
    setConfig({apiKey: 'key', realm: 'test', cacheUser, ...(type ? {type} : {})});
    initApiClient('key');
    localStorage.clear();
    vi.restoreAllMocks();
    setCurrentUser(null);
}
