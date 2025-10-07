import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../src/api-client.ts';
import * as version from '../src/version.ts';

// Mock fetch
global.fetch = vi.fn();

// No need to mock version - use actual version from package.json

describe('ApiClient', () => {
    let apiClient: ApiClient;
    const mockUser = { uid: '1', token: 't', is_admin: false };

    beforeEach(() => {
        vi.resetAllMocks();
        // Reset the fetch mock
        (global.fetch as any).mockReset();

        // Create a new ApiClient instance for each test
        apiClient = new ApiClient('test-api-key');
    });

    describe('fetchStates', () => {
        it('fetches states from the backend', async () => {
            // Mock the fetch response
            const mockResponse = {
                status: 'success',
                states: [
                    { name: 'test1', value: 'value1', data_type: 'str' },
                    { name: 'test2', value: 'value2', data_type: 'str' }
                ]
            };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await apiClient.fetchStates(['test1', 'test2'], mockUser);
            expect(result).toEqual(mockResponse);
            // Validate fetch was called with correct URL and options
            expect(global.fetch).toHaveBeenCalled();
            const call = (global.fetch as any).mock.calls[0];
            expect(call[0]).toBe('https://pumproom-api.inzhenerka-cloud.com/tracker/get_states');
            const opts = call[1];
            expect(opts).toEqual(expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': 'test-api-key',
                },
            }));
            const body = JSON.parse(opts.body);
            // Legacy flat fields preserved
            expect(body.url).toBe(window.location.href);
            expect(body.sdk_version).toBe(version.getVersion());
            expect(body.state_names).toEqual(['test1', 'test2']);
            expect(body.user).toEqual(mockUser);
            // Context is passed from SDK config only; no defaults in tests
            expect(body.context).toEqual({});
        });

        it('throws an error if the fetch request fails', async () => {
            // Mock the fetch response to fail
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(async () => {
                await apiClient.fetchStates(['test1'], mockUser);
            }).rejects.toThrow('Request error: 500 Internal Server Error');
        });
    });

    describe('storeStates', () => {
        it('stores states to the backend', async () => {
            // Mock the fetch response
            const mockResponse = {
                status: 'success'
            };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const states = [
                { name: 'test1', value: 'value1' },
                { name: 'test2', value: 'value2' }
            ];
            const result = await apiClient.storeStates(states, mockUser);
            expect(result).toEqual(mockResponse);
            // Validate fetch was called with correct URL and options
            expect(global.fetch).toHaveBeenCalled();
            const call = (global.fetch as any).mock.calls[0];
            expect(call[0]).toBe('https://pumproom-api.inzhenerka-cloud.com/tracker/set_states');
            const opts = call[1];
            expect(opts).toEqual(expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': 'test-api-key',
                },
            }));
            const body = JSON.parse(opts.body);
            // Legacy flat fields preserved
            expect(body.url).toBe(window.location.href);
            expect(body.sdk_version).toBe(version.getVersion());
            expect(body.states).toEqual(states);
            expect(body.user).toEqual(mockUser);
            // Context is passed from SDK config only; no defaults in tests
            expect(body.context).toEqual({});
        });

        it('throws an error if the fetch request fails', async () => {
            // Mock the fetch response to fail
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(async () => {
                await apiClient.storeStates([{ name: 'test1', value: 'value1' }], mockUser);
            }).rejects.toThrow('Request error: 500 Internal Server Error');
        });
    });
});
