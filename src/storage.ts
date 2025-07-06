/**
 * Storage module for PumpRoom SDK
 * 
 * This module provides utilities for storing and retrieving data
 * from the browser's localStorage, with error handling for environments
 * where localStorage is not available or when parsing fails.
 * 
 * @module Storage
 */

/**
 * Retrieves data from localStorage
 * 
 * This function attempts to retrieve and parse JSON data from localStorage.
 * It handles cases where localStorage is not available or when parsing fails.
 * 
 * @param key - The key to retrieve data for
 * @returns The parsed data object or null if retrieval or parsing failed
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
 */
export function storeData(key: string, data: Record<any, any>): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        console.error('Cache save error', err);
    }
}
