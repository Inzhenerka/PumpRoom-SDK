/**
 * Constants module for PumpRoom SDK
 *
 * This module defines various constants used throughout the SDK,
 * including API URLs, PumpRoom domains, and storage keys.
 *
 * @module Constants
 */

/**
 * Base URL for the PumpRoom API
 *
 * @public
 */
export const API_BASE_URL = "https://pumproom-api.inzhenerka-cloud.com";

/**
 * Normalizes and validates a PumpRoom API base URL.
 *
 * @param value - HTTP(S) URL, optionally including a path prefix
 * @returns URL without a trailing slash
 * @internal
 */
export function normalizeApiBaseUrl(value: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("apiBaseUrl must be a valid HTTP(S) URL");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("apiBaseUrl must be a valid HTTP(S) URL");
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("apiBaseUrl must be a valid HTTP(S) URL without credentials, query, or hash");
  }
  return url.toString().replace(/\/+$/, "");
}

/**
 * URL for the authentication endpoint
 *
 * @public
 */
export const AUTH_URL = `${API_BASE_URL}/integration/authenticate`;

/**
 * URL for the token verification endpoint
 *
 * @public
 */
export const VERIFY_URL = `${API_BASE_URL}/integration/verify_token`;

/**
 * URL to load states from backend
 *
 * @experimental
 */
export const GET_STATES_URL = `${API_BASE_URL}/tracker/get_states`;

/**
 * URL to store states on backend
 *
 * @experimental
 */
export const SET_STATES_URL = `${API_BASE_URL}/tracker/set_states`;

/**
 * URL to load course data
 *
 * @experimental
 */
export const LOAD_COURSE_URL = `${API_BASE_URL}/course/load`;

/** Standard origins used for iframe sizing and opt-in message sender checks. */
export const DEFAULT_TRUSTED_ORIGINS = [
  "https://pumproom.inzhenerka-cloud.com",
  "https://dev.pumproom.inzhenerka-cloud.com",
  "https://dev-pumproom.inzhenerka-cloud.com",
] as const;

/**
 * Key used for storing user data in localStorage
 *
 * @public
 */
export const USER_STORAGE_KEY = "pumproomUser";

/**
 * Prefix for localStorage keys to avoid conflicts with other applications when storing states
 *
 * @experimental
 */
export const STORAGE_PREFIX = "pumproomState:";

/**
 * Prefix for localStorage keys to avoid conflicts when storing course data
 *
 * @experimental
 */
export const COURSE_STORAGE_PREFIX = "pumproomCourse:";
