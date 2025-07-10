import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../src/api-client.ts';
import * as version from '../src/version.ts';

// Mock fetch
global.fetch = vi.fn();

// Mock version
vi.spyOn(version, 'getVersion').mockReturnValue('1.2.0');

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
            expect(global.fetch).toHaveBeenCalledWith(
                'https://pumproom-api.inzhenerka-cloud.com/tracker/get_states',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': 'test-api-key',
                    },
                    body: JSON.stringify({
                        user: mockUser,
                        url: window.location.href,
                        state_names: ['test1', 'test2'],
                        sdk_version: '1.2.0'
                    })
                })
            );
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
            expect(global.fetch).toHaveBeenCalledWith(
                'https://pumproom-api.inzhenerka-cloud.com/tracker/set_states',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': 'test-api-key',
                    },
                    body: JSON.stringify({
                        user: mockUser,
                        url: window.location.href,
                        states,
                        sdk_version: '1.2.0'
                    })
                })
            );
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