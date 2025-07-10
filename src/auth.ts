/**
 * Authentication module for PumpRoom SDK
 *
 * This module handles user authentication, verification, and management.
 * It provides functions for authenticating users and setting user information.
 *
 * @module Authentication
 * @category Authentication
 */
import type {PumpRoomUser, AuthenticateOptions, LMSProfileInput} from './types/index.ts';
import type {SetPumpRoomUserMessage} from './types/messages.ts';
import {USER_STORAGE_KEY} from './constants.ts';
import {retrieveData, storeData} from './storage.ts';
import {
    getConfig,
    setCurrentUser,
    getCurrentUser,
    registerAutoListener,
    isAutoListenerRegistered,
} from './globals.ts';
import {getPumpRoomEventMessage} from './messaging.ts';
import {getApiClient} from './api-client.ts';

/**
 * Validates an email address format
 *
 * @param email - The email address to validate
 * @returns True if the email is valid, false otherwise
 * @internal
 */
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Normalizes the LMS profile data
 *
 * If an email is provided without an ID, and the email is valid,
 * it will be used as the ID.
 *
 * @param lms - The LMS profile data to normalize
 * @returns The normalized LMS profile data
 * @internal
 */
function normalizeLmsProfile(lms?: LMSProfileInput | null): LMSProfileInput | null | undefined {
    if (!lms) return lms;

    if (lms.id && lms.email) {
        console.warn('LMS email provided along with id; email will be ignored');
    } else if (!lms.id && lms.email) {
        if (isValidEmail(lms.email)) {
            lms.id = lms.email;
        } else {
            console.warn('Invalid email supplied to LMS profile');
        }
    }

    return lms;
}

/**
 * Verifies a cached user token with the API
 *
 * @param user - The user to verify
 * @returns Promise resolving to true if the token is valid, false otherwise
 * @internal
 */
async function verifyCachedUser(user: PumpRoomUser): Promise<boolean> {
    const config = getConfig();
    if (!config) return false;

    try {
        const apiClient = getApiClient();
        const result = await apiClient.verifyToken(user, config.realm);

        if (result.is_valid) {
            user.is_admin = result.is_admin;
            storeData(USER_STORAGE_KEY, user);
        }
        return result.is_valid;
    } catch (err) {
        console.error('Verification error', err);
        return false;
    }
}

/**
 * Authenticates a user with the PumpRoom service
 *
 * This function attempts to authenticate a user using the provided options.
 * If caching is enabled, it will first try to use a cached user.
 *
 * @param options - Authentication options containing LMS and/or profile data
 * @returns Promise resolving to the authenticated user or null if authentication failed
 * @category Authentication
 * @public
 * @example
 * ```typescript
 * import { authenticate } from 'pumproom-sdk';
 *
 * const user = await authenticate({
 *   lms: {
 *     id: 'user123',
 *     name: 'John Doe'
 *   }
 * });
 *
 * if (user) {
 *   console.log('Authenticated as', user.uid);
 * }
 * ```
 */
export async function authenticate({lms, profile}: AuthenticateOptions = {}): Promise<PumpRoomUser> {
    const config = getConfig();
    if (!config) {
        throw new Error('SDK is not initialized');
    }

    let currentUser = getCurrentUser();
    let fromCache = false;
    if (config.cacheUser) {
        const cachedUser = retrieveData(USER_STORAGE_KEY) as PumpRoomUser;
        if (cachedUser && (await verifyCachedUser(cachedUser))) {
            currentUser = cachedUser;
            fromCache = true;
        } else if (cachedUser && typeof localStorage !== 'undefined') {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }

    if (!fromCache) {
        const apiClient = getApiClient();
        const normLms = normalizeLmsProfile(lms);
        currentUser = await apiClient.authenticate({lms: normLms, profile}, config.realm);

        if (config.cacheUser) {
            storeData(USER_STORAGE_KEY, currentUser);
        }
    }

    if (!currentUser) {
        throw new Error('Authentication failed');
    }

    if (!isAutoListenerRegistered()) {
        window.addEventListener('message', defaultUserListener);
        registerAutoListener();
    }

    setCurrentUser(currentUser);

    document.dispatchEvent(new CustomEvent('itAuthenticationCompleted', {detail: currentUser}));

    return currentUser;
}

/**
 * Sets a user directly without going through the authentication flow
 *
 * This function verifies the provided user token and sets it as the current user
 * if valid. This is useful when you already have a valid user token.
 *
 * @param user - The user object containing uid and token
 * @returns Promise resolving to the verified user or null if verification failed
 * @category Authentication
 * @public
 * @example
 * ```typescript
 * import { setUser } from 'pumproom-sdk';
 *
 * const user = await setUser({
 *   uid: 'user123',
 *   token: 'valid-token'
 * });
 *
 * if (user) {
 *   console.log('User set successfully');
 * }
 * ```
 */
export async function setUser(user: Omit<PumpRoomUser, 'is_admin'>): Promise<PumpRoomUser | null> {
    const config = getConfig();
    if (!config) {
        throw new Error('SDK is not initialized');
    }

    let verified: PumpRoomUser;

    try {
        const apiClient = getApiClient();
        const result = await apiClient.verifyToken({...user, is_admin: false}, config.realm);

        if (!result.is_valid) {
            console.error('Invalid user passed to setUser');
            return null;
        }

        verified = {...user, is_admin: result.is_admin};
    } catch (err) {
        console.error('Verification error', err);
        return null;
    }

    if (config.cacheUser) {
        storeData(USER_STORAGE_KEY, verified);
    }
    setCurrentUser(verified);

    if (!isAutoListenerRegistered()) {
        window.addEventListener('message', defaultUserListener);
        registerAutoListener();
    }

    document.dispatchEvent(new CustomEvent('itAuthenticationCompleted', {detail: verified}));
    return verified;
}

/**
 * Default event listener for handling user-related messages
 *
 * @param event - The message event
 * @internal
 */
function defaultUserListener(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event, 'getPumpRoomUser');
    if (!data) return;
    const user = getCurrentUser();
    if (!user) return;
    if (event.source) {
        const message: SetPumpRoomUserMessage = {
            service: 'pumproom',
            type: 'setPumpRoomUser',
            payload: user,
        };
        (event.source as Window).postMessage(message, event.origin);
    }
}
