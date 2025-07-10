/**
 * Storage module for PumpRoom SDK
 *
 * This module provides utilities for storing and retrieving data
 * from the browser's localStorage, with error handling for environments
 * where localStorage is not available or when parsing fails.
 *
 * @module Storage
 */

import {getCurrentNormalizedUrl} from "./utils.js";
import {STORAGE_PREFIX} from './constants.ts';
import type {StateOutput} from './types/index.ts';

/**
 * Retrieves data from localStorage
 *
 * This function attempts to retrieve and parse JSON data from localStorage.
 * It handles cases where localStorage is not available or when parsing fails.
 *
 * @param key - The key to retrieve data for
 * @returns The parsed data object or null if retrieval or parsing failed
 *
 * @example
 * ```typescript
 * const user = retrieveData('user');
 * ```
 */
export function retrieveData(key: string): Record<any, any> | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as Record<any, any>) : null;
    } catch (err) {
        console.error('Cache read error', err);
        return null;
    }
}

/**
 * Stores data in localStorage
 *
 * This function attempts to stringify and store data in localStorage.
 * It handles cases where localStorage is not available or when stringification fails.
 *
 * @param key - The key to store data under
 * @param data - The data object to store
 *
 * @example
 * ```typescript
 * storeData('user', { id: 1 });
 * ```
 */
export function storeData(key: string, data: Record<any, any>): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        console.error('Cache save error', err);
    }
}

/**
 * Generates a unique key for a state in localStorage
 *
 * @param stateName - Name of the state
 * @param userId - User ID
 * @returns Unique key for the state
 *
 * @experimental
 */
export function generateStateKey(stateName: string, userId: string): string {
    const pageUrl = getCurrentNormalizedUrl();
    if (!pageUrl) {
        throw new Error('Unable to determine current page URL');
    }
    return `${STORAGE_PREFIX}:${pageUrl}:${stateName}:${userId}`;
}

/**
 * Saves states to localStorage
 *
 * @param states - Array of states to save
 * @param userId - User ID
 *
 * @experimental
 */
export function saveStatesToLocalStorage(states: StateOutput[], userId: string): void {
    try {
        states.forEach(state => {
            const key = generateStateKey(state.name, userId);
            localStorage.setItem(key, JSON.stringify(state));
        });
    } catch (error) {
        console.warn('Failed to save states to localStorage:', error);
    }
}

/**
 * Retrieves states from localStorage
 *
 * @param stateNames - Array of state names to retrieve
 * @param userId - User ID
 * @returns Array of states retrieved from localStorage
 *
 * @experimental
 */
export function getStatesFromLocalStorage(stateNames: string[], userId: string): StateOutput[] {
    const states: StateOutput[] = [];

    try {
        stateNames.forEach(stateName => {
            const key = generateStateKey(stateName, userId);
            const stateJson = localStorage.getItem(key);

            if (stateJson) {
                const state = JSON.parse(stateJson) as StateOutput;
                states.push(state);
            }
        });
    } catch (error) {
        console.warn('Failed to retrieve states from localStorage:', error);
    }

    return states;
}
