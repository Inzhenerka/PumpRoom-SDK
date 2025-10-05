import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

let mockRegisteredStates: string[] = [];

vi.mock('../src/globals.ts', async () => {
    const actual = await vi.importActual<typeof import('../src/globals.ts')>('../src/globals.ts');
    return {
        ...actual,
        getCurrentUser: vi.fn(),
        registerStates: vi.fn((stateNames: string[]) => {
            if (!Array.isArray(stateNames)) {
                throw new Error('stateNames must be an array');
            }
            stateNames.forEach(state => {
                if (!mockRegisteredStates.includes(state)) {
                    mockRegisteredStates.push(state);
                }
            });
        }),
        getRegisteredStates: vi.fn(() => [...mockRegisteredStates]),
        resetRegisteredStates: vi.fn(() => {
            mockRegisteredStates = [];
        }),
    };
});

import {
    fetchStates,
    storeStates,
    clearStates,
    getRegisteredStates,
    resetRegisteredStates,
} from '../src/states.ts';
import * as globals from '../src/globals.ts';
import * as version from '../src/version.ts';
import { mockUser, setupSdk } from './test-utils.ts';

// Mock fetch
global.fetch = vi.fn();

// No need to mock version - use actual version from package.json

describe('states', () => {
    beforeEach(() => {
        setupSdk();
        global.fetch = vi.fn();
        vi.resetAllMocks();
        // Reset the fetch mock
        (global.fetch as any).mockReset();
    });

    afterEach(() => {
        // Reset the registered states between tests
        resetRegisteredStates();
    });

    describe('registerStates', () => {
        it('registers state names', () => {
            globals.registerStates(['test1', 'test2']);
            expect(getRegisteredStates()).toEqual(['test1', 'test2']);
        });

        it('does not register duplicate state names', () => {
            globals.registerStates(['test1', 'test2']);
            globals.registerStates(['test2', 'test3']);
            expect(getRegisteredStates()).toEqual(['test1', 'test2', 'test3']);
        });

        it('throws an error if stateNames is not an array', () => {
            expect(() => {
                // @ts-ignore - Testing runtime error
                globals.registerStates('not an array');
            }).toThrow('stateNames must be an array');
        });
    });

    describe('fetchStates', () => {
        it('fetches states from the backend', async () => {
            // Mock the getCurrentUser function
            vi.mocked(globals.getCurrentUser).mockReturnValue(mockUser);

            // Mock the fetch response
            const mockResponse = {
                status: 'success',
                states: [
                    {name: 'test1', value: 'value1', data_type: 'str'},
                    {name: 'test2', value: 'value2', data_type: 'str'}
                ]
            };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchStates(['test1', 'test2']);
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalled();
            const call = (global.fetch as any).mock.calls[0];
            expect(call[0]).toBe('https://pumproom-api.inzhenerka-cloud.com/tracker/get_states');
            const opts = call[1];
            expect(opts).toEqual(expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': 'key',
                },
            }));
            const body = JSON.parse(opts.body);
            expect(body.user).toEqual(mockUser);
            expect(body.state_names).toEqual(['test1', 'test2']);
            expect(body.url).toBe(window.location.href);
            expect(body.sdk_version).toBe(version.getVersion());
            expect(body.context).toEqual(expect.objectContaining({
                url: window.location.href,
                sdk_version: version.getVersion(),
            }));
        });

        it('throws an error if stateNames is not an array', async () => {
            await expect(async () => {
                // @ts-ignore - Testing runtime error
                await fetchStates('not an array');
            }).rejects.toThrow('stateNames must be non-empty array of strings');
        });

        it('throws an error if stateNames is an empty array', async () => {
            await expect(async () => {
                await fetchStates([]);
            }).rejects.toThrow('stateNames must be non-empty array of strings');
        });

        it('throws an error if user is not authenticated', async () => {
            // Mock the getCurrentUser function to return null
            vi.mocked(globals.getCurrentUser).mockReturnValue(null);

            await expect(async () => {
                await fetchStates(['test1']);
            }).rejects.toThrow('User is not authenticated');
        });

        it('throws an error if the fetch request fails', async () => {
            // Mock the getCurrentUser function
            vi.mocked(globals.getCurrentUser).mockReturnValue(mockUser);

            // Mock the fetch response to fail
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(async () => {
                await fetchStates(['test1']);
            }).rejects.toThrow('Request error: 500 Internal Server Error');
        });
    });

    describe('storeStates', () => {
        it('stores states to the backend', async () => {
            // Mock the getCurrentUser function
            vi.mocked(globals.getCurrentUser).mockReturnValue(mockUser);

            // Mock the fetch response
            const mockResponse = {
                status: 'success'
            };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const states = [
                {name: 'test1', value: 'value1'},
                {name: 'test2', value: 'value2'}
            ] as Array<{ name: string, value: boolean | number | string | null }>;
            const result = await storeStates(states);
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalled();
            const call = (global.fetch as any).mock.calls[0];
            expect(call[0]).toBe('https://pumproom-api.inzhenerka-cloud.com/tracker/set_states');
            const opts = call[1];
            expect(opts).toEqual(expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': 'key',
                },
            }));
            const body = JSON.parse(opts.body);
            expect(body.user).toEqual(mockUser);
            expect(body.states).toEqual(states);
            expect(body.url).toBe(window.location.href);
            expect(body.sdk_version).toBe(version.getVersion());
            expect(body.context).toEqual(expect.objectContaining({
                url: window.location.href,
                sdk_version: version.getVersion(),
            }));
        });

        it('throws an error if states is not an array', async () => {
            await expect(async () => {
                // @ts-ignore - Testing runtime error
                await storeStates('not an array');
            }).rejects.toThrow('states parameter must be array of objects');
        });

        it('throws an error if user is not authenticated', async () => {
            // Mock the getCurrentUser function to return null
            vi.mocked(globals.getCurrentUser).mockReturnValue(null);

            await expect(async () => {
                await storeStates([{name: 'test1', value: 'value1'}]);
            }).rejects.toThrow('User is not authenticated');
        });
    });

    describe('clearStates', () => {
        it('clears states on the backend', async () => {
            // Mock the getCurrentUser function
            vi.mocked(globals.getCurrentUser).mockReturnValue(mockUser);

            // Mock the fetch response
            const mockResponse = {
                status: 'success'
            };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await clearStates(['test1', 'test2']);
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalled();
            const call = (global.fetch as any).mock.calls[0];
            expect(call[0]).toBe('https://pumproom-api.inzhenerka-cloud.com/tracker/set_states');
            const opts = call[1];
            expect(opts).toEqual(expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': 'key',
                },
            }));
            const body = JSON.parse(opts.body);
            expect(body.user).toEqual(mockUser);
            expect(body.states).toEqual([
                {name: 'test1', value: null},
                {name: 'test2', value: null}
            ]);
            expect(body.url).toBe(window.location.href);
            expect(body.sdk_version).toBe(version.getVersion());
            expect(body.context).toEqual(expect.objectContaining({
                url: window.location.href,
                sdk_version: version.getVersion(),
            }));
        });

        it('throws an error if stateNames is not an array', async () => {
            await expect(async () => {
                // @ts-ignore - Testing runtime error
                await clearStates('not an array');
            }).rejects.toThrow('stateNames must be non-empty array of strings');
        });

        it('throws an error if stateNames is an empty array', async () => {
            await expect(async () => {
                await clearStates([]);
            }).rejects.toThrow('stateNames must be non-empty array of strings');
        });
    });
});
