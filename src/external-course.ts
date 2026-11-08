/**
 * External LMS course data for PumpRoom SDK
 *
 * This module provides functionality for loading external course information from the backend.
 * Course data is cached in localStorage for faster access during page load.
 *
 * @module ExternalCourses
 * @category Courses
 * @experimental
 */

import { getApiClient } from "./api-client.ts";
import { getConfig } from "./globals.ts";
import { getExternalCourseFromLocalStorage, saveExternalCourseToLocalStorage } from "./storage.ts";
import type { ExternalCourseDataCallback, LoadExternalCourseDataOutput } from "./types/index.ts";
import { getCurrentNormalizedUrl } from "./utils.ts";

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
 * const data = await loadExternalCourseData((cached) => {
 *   console.log('Cached course:', cached.external_course?.visible_name);
 * });
 * console.log('Fresh course:', data.external_course?.visible_name);
 * ```
 */
export async function loadExternalCourseData(
  callback?: ExternalCourseDataCallback,
): Promise<LoadExternalCourseDataOutput> {
  const config = getConfig();
  if (!config) {
    throw new Error("SDK is not initialized");
  }

  const pageUrl = getCurrentNormalizedUrl();
  const cached = getExternalCourseFromLocalStorage(pageUrl);
  if (cached && callback) {
    callback(cached);
  }

  const apiClient = getApiClient();
  const response = await apiClient.loadExternalCourseData(config.realm);

  saveExternalCourseToLocalStorage(response, pageUrl);

  if (callback) {
    callback(response);
  }

  return response;
}
