import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
    fetchStates,
    storeStates,
    clearStates,
    getRegisteredStates,
    resetRegisteredStates
} from '../src/states.ts';
import * as globals from '../src/globals.ts';
import * as version from '../src/version.ts';

// Mock fetch
global.fetch = vi.fn();

// Mock version
vi.spyOn(version, 'getVersion').mockReturnValue('1.2.0');

// Mock globals.ts
let mockRegisteredStates: string[] = [];

vi.mock('../src/globals.ts', () => ({
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
}));

describe('states', () => {
    beforeEach(() => {
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
            vi.mocked(globals.getCurrentUser).mockReturnValue({uid: '1', token: 't', is_admin: false});

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
            expect(global.fetch).toHaveBeenCalledWith(
                'https://pumproom-api.inzhenerka-cloud.com/tracker/get_states',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user: {uid: '1', token: 't', is_admin: false},
                        url: window.location.href,
                        state_names: ['test1', 'test2'],
                        sdk_version: '1.2.0'
                    })
                })
            );
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
            vi.mocked(globals.getCurrentUser).mockReturnValue({uid: '1', token: 't', is_admin: false});

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
            vi.mocked(globals.getCurrentUser).mockReturnValue({uid: '1', token: 't', is_admin: false});

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
            expect(global.fetch).toHaveBeenCalledWith(
                'https://pumproom-api.inzhenerka-cloud.com/tracker/set_states',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user: {uid: '1', token: 't', is_admin: false},
                        url: window.location.href,
                        states,
                        sdk_version: '1.2.0'
                    })
                })
            );
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
            vi.mocked(globals.getCurrentUser).mockReturnValue({uid: '1', token: 't', is_admin: false});

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
            expect(global.fetch).toHaveBeenCalledWith(
                'https://pumproom-api.inzhenerka-cloud.com/tracker/set_states',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user: {uid: '1', token: 't', is_admin: false},
                        url: window.location.href,
                        states: [
                            {name: 'test1', value: null},
                            {name: 'test2', value: null}
                        ] as Array<{ name: string, value: boolean | number | string | null }>,
                        sdk_version: '1.2.0'
                    })
                })
            );
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
