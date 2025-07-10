/**
 * States management module for PumpRoom SDK
 *
 * This module provides functionality for managing user states on the backend.
 * It allows registering, fetching, storing, and clearing states.
 * States are also cached in localStorage for faster access during page load.
 *
 * @module States
 * @category States
 * @experimental
 */

import {getCurrentUser, registerStates, getRegisteredStates, resetRegisteredStates} from './globals.ts';
import {getApiClient} from './api-client.ts';
import {generateStateKey, saveStatesToLocalStorage, getStatesFromLocalStorage} from './storage.ts';
import type {State, GetStatesResponse, SetStatesResponse, StateOutput} from './types/index.ts';
import {StateDataType} from './types/index.ts';


/**
 * Fetches states from the backend
 *
 * This function retrieves the values of the specified states from the backend.
 * It first checks localStorage for cached values and then fetches from the backend.
 * After fetching from the backend, it updates the localStorage cache.
 *
 * @param stateNames - Array of state names to fetch
 * @returns Promise resolving to the fetched states
 * @throws Error if stateNames is not a non-empty array or if user is not authenticated
 *
 * @category States
 * @experimental
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

    // Check localStorage for cached states
    const cachedStates = getStatesFromLocalStorage(stateNames, currentUser.uid);

    // Create a response with cached states if available
    if (cachedStates.length > 0) {
        console.debug('Using cached states from localStorage:', cachedStates);
    }

    // Get the API client
    const apiClient = getApiClient();

    // Use the API client to fetch states from the backend
    const response = await apiClient.fetchStates(stateNames, currentUser);

    // Update localStorage with the fetched states
    saveStatesToLocalStorage(response.states, currentUser.uid);

    return response;
}

// State interface is now imported from types/index.ts

/**
 * Stores states to the backend
 *
 * This function saves the provided states to the backend and also updates the localStorage cache.
 *
 * @param states - Array of state objects to store
 * @returns Promise resolving to the result of the operation
 * @throws Error if states is not an array or if user is not authenticated
 *
 * @category States
 * @experimental
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
    const response = await apiClient.storeStates(states, currentUser);

    // Convert State[] to StateOutput[] for localStorage
    const stateOutputs: StateOutput[] = states.map(state => ({
        name: state.name,
        value: state.value,
        // Determine data_type based on value type
        data_type: state.value === null ? StateDataType.null :
            typeof state.value === 'boolean' ? StateDataType.bool :
                typeof state.value === 'number' ? StateDataType.int : StateDataType.str
    }));

    saveStatesToLocalStorage(stateOutputs, currentUser.uid);

    return response;
}

/**
 * Clears states on the backend
 *
 * This function sets the values of the specified states to null on the backend
 * and also updates the localStorage cache.
 *
 * @param stateNames - Array of state names to clear
 * @returns Promise resolving to the result of the operation
 * @throws Error if stateNames is not a non-empty array
 *
 * @category States
 * @experimental
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
    // This will also update the localStorage cache
    return storeStates(emptyStates);
}

/**
 * Gets the list of registered state names
 *
 * @returns Array of registered state names
 *
 * @category States
 * @experimental
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
