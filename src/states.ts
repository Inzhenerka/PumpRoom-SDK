/**
 * States management module for PumpRoom SDK
 *
 * This module provides functionality for managing user states on the backend.
 * It allows registering, fetching, storing, and clearing states.
 *
 * @module States
 * @category Experimental
 */

import {getCurrentUser, registerStates, getRegisteredStates, resetRegisteredStates} from './globals.ts';
import {getApiClient} from './api-client.ts';
import type {State, GetStatesResponse, SetStatesResponse} from './types/index.ts';

/**
 * Fetches states from the backend
 *
 * This function retrieves the values of the specified states from the backend.
 *
 * @param stateNames - Array of state names to fetch
 * @returns Promise resolving to the fetched states
 * @throws Error if stateNames is not a non-empty array or if user is not authenticated
 *
 * @category Experimental
 * @example
 * ```typescript
 * // Using async/await
 * try {
 *   const states = await fetchStates(['userPreferences', 'lastVisitedPage']);
 *   console.log(states);
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * // Using Promise chain
 * fetchStates(['userPreferences', 'lastVisitedPage'])
 *   .then(states => console.log(states))
 *   .catch(error => console.error(error));
 * ```
 */
export async function fetchStates(stateNames: string[]): Promise<GetStatesResponse> {
    // Validate stateNames parameter
    if (!Array.isArray(stateNames) || stateNames.length === 0) {
        throw new Error('stateNames must be non-empty array of strings');
    }

    // Register the state names globally
    registerStates(stateNames);

    // Get the current user
    const currentUser = getCurrentUser();

    // Check if user is authenticated
    if (!currentUser) {
        throw new Error('User is not authenticated');
    }

    // Get the API client
    const apiClient = getApiClient();

    // Use the API client to fetch states
    return apiClient.fetchStates(stateNames, currentUser);
}

// State interface is now imported from types/index.ts

/**
 * Stores states to the backend
 *
 * This function saves the provided states to the backend.
 *
 * @param states - Array of state objects to store
 * @returns Promise resolving to the result of the operation
 * @throws Error if states is not an array or if user is not authenticated
 *
 * @category Experimental
 * @example
 * ```typescript
 * // Using async/await
 * try {
 *   const result = await storeStates([
 *     { name: 'userPreferences', value: 'dark' },
 *     { name: 'lastVisitedPage', value: '/dashboard' }
 *   ]);
 *   console.log(result);
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * // Using Promise chain
 * storeStates([
 *   { name: 'userPreferences', value: 'dark' },
 *   { name: 'lastVisitedPage', value: '/dashboard' }
 * ])
 *   .then(result => console.log(result))
 *   .catch(error => console.error(error));
 * ```
 */
export async function storeStates(states: State[]): Promise<SetStatesResponse> {
    // Validate states parameter
    if (!Array.isArray(states)) {
        throw new Error('states parameter must be array of objects');
    }

    // Register the state names globally
    registerStates(states.map(state => state.name));

    // Get the current user
    const currentUser = getCurrentUser();

    // Check if user is authenticated
    if (!currentUser) {
        throw new Error('User is not authenticated');
    }

    // Get the API client
    const apiClient = getApiClient();

    // Use the API client to store states
    return apiClient.storeStates(states, currentUser);
}

/**
 * Clears states on the backend
 *
 * This function sets the values of the specified states to null on the backend.
 *
 * @param stateNames - Array of state names to clear
 * @returns Promise resolving to the result of the operation
 * @throws Error if stateNames is not a non-empty array
 *
 * @category Experimental
 * @example
 * ```typescript
 * // Using async/await
 * try {
 *   const result = await clearStates(['userPreferences', 'lastVisitedPage']);
 *   console.log(result);
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * // Using Promise chain
 * clearStates(['userPreferences', 'lastVisitedPage'])
 *   .then(result => console.log(result))
 *   .catch(error => console.error(error));
 * ```
 */
export async function clearStates(stateNames: string[]): Promise<SetStatesResponse> {
    // Validate stateNames parameter
    if (!Array.isArray(stateNames) || stateNames.length === 0) {
        throw new Error('stateNames must be non-empty array of strings');
    }

    // Create an array of state objects with null values
    const emptyStates: State[] = stateNames.map(stateName => ({
        name: stateName,
        value: null
    }));

    // Use the existing storeStates function to save the empty states
    return storeStates(emptyStates);
}

/**
 * Gets the list of registered state names
 *
 * @returns Array of registered state names
 *
 * @example
 * ```typescript
 * const states = getRegisteredStates();
 * console.log(states); // ['userPreferences', 'lastVisitedPage']
 * ```
 */
export {getRegisteredStates}

/**
 * Resets the list of registered state names
 *
 * This function is primarily used for testing purposes.
 *
 * @internal
 */
export {resetRegisteredStates}
