/**
 * Course data module for PumpRoom SDK
 *
 * This module provides functionality for loading course information from the backend.
 * Course data is cached in localStorage for faster access during page load.
 *
 * @module Courses
 * @category Courses
 * @experimental
 */

import {getApiClient} from './api-client.ts';
import {getConfig} from './globals.ts';
import {getCourseFromLocalStorage, saveCourseToLocalStorage} from './storage.ts';
import type {CourseDataCallback, LoadCourseDataOutput} from './types/index.ts';

/**
 * Loads course data for the current page
 *
 * This function retrieves course details from the backend and caches them locally.
 * If a callback is provided and cached data exists, it will be called first with
 * the cached data, and then with the fresh data from the server.
 *
 * @param callback - Optional callback function invoked with course data
 * @returns Promise resolving to the loaded course data
 * @throws Error if the SDK is not initialized or the request fails
 *
 * @category Courses
 * @experimental
 * @example
 * ```typescript
 * const data = await loadCourseData((cached) => {
 *   console.log('Cached course:', cached.course?.visible_name);
 * });
 * console.log('Fresh course:', data.course?.visible_name);
 * ```
 */
export async function loadCourseData(callback?: CourseDataCallback): Promise<LoadCourseDataOutput> {
    const config = getConfig();
    if (!config) {
        throw new Error('SDK is not initialized');
    }

    const cached = getCourseFromLocalStorage();
    if (cached && callback) {
        callback(cached);
    }

    const apiClient = getApiClient();
    const response = await apiClient.loadCourseData(config.realm);

    saveCourseToLocalStorage(response);

    if (callback) {
        callback(response);
    }

    return response;
}
