/**
 * Constants module for PumpRoom SDK
 * 
 * This module defines various constants used throughout the SDK,
 * including API URLs, PumpRoom domains, and storage keys.
 * 
 * @module Constants
 */

/** Base URL for the PumpRoom API */
export const API_BASE_URL = 'https://pumproom-api.inzhenerka-cloud.com';

/** URL for the authentication endpoint */
export const AUTH_URL = `${API_BASE_URL}/tracker/authenticate`;

/** URL for the token verification endpoint */
export const VERIFY_URL = `${API_BASE_URL}/tracker/verify_token`;

/** 
 * List of domains that are considered PumpRoom domains
 * Used to identify PumpRoom iframes
 */
export const PUMPROOM_DOMAINS = [
    'https://pumproom.',
    'https://pump-room.',
    'https://dev.pumproom.',
    'https://ide.code.winbd.ru'
] as const;

/** Key used for storing user data in localStorage */
export const userStorageKey = 'pumproomUser'
