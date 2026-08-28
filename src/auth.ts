/**
 * Authentication module for PumpRoom SDK
 *
 * This module handles user authentication, verification, and management.
 * It provides functions for authenticating users and setting user information.
 *
 * @module Authentication
 * @category Authentication
 */
import { getApiClient } from "./api-client.ts";
import { USER_STORAGE_KEY } from "./constants.ts";
import {
  getConfig,
  getCurrentUser,
  isAutoListenerRegistered,
  registerAutoListener,
  setCurrentUser,
} from "./globals.ts";
import { getPumpRoomEventMessage } from "./messaging.ts";
import { retrieveData, storeData } from "./storage.ts";
import type { AuthenticateOptions, PumpRoomUser } from "./types/index.ts";
import type { SetPumpRoomUserMessage } from "./types/messages.ts";

/**
 * Checks whether an unknown cached value has the credentials required for verification.
 */
function isPumpRoomUser(value: unknown): value is PumpRoomUser {
  if (typeof value !== "object" || value === null) return false;

  const user = value as Partial<PumpRoomUser>;
  return (
    typeof user.uid === "string" &&
    user.uid.length > 0 &&
    typeof user.token === "string" &&
    user.token.length > 0 &&
    typeof user.is_admin === "boolean"
  );
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

  const apiClient = getApiClient();
  const result = await apiClient.verifyToken(user, config.realm);

  if (result.is_valid) {
    user.is_admin = result.is_admin;
    storeData(USER_STORAGE_KEY, user);
  }
  return result.is_valid;
}

/**
 * Authenticates a user with the PumpRoom service
 *
 * This function attempts to authenticate a user using the provided options.
 * If caching is enabled, it will first try to use a cached user.
 *
 * @param options - Authentication options containing student identity data
 * @returns Promise resolving to the authenticated user
 * @throws Error if the SDK is not initialized or authentication fails
 * @category Authentication
 * @public
 * @example
 * ```typescript
 * import { authenticate } from 'pumproom-sdk';
 *
 * const user = await authenticate({
 *   identity: {
 *     provider: 'lms',
 *     id: 'user123'
 *   }
 * });
 *
 * if (user) {
 *   console.log('Authenticated as', user.uid);
 * }
 * ```
 */
export async function authenticate({ identity }: AuthenticateOptions): Promise<PumpRoomUser> {
  const config = getConfig();
  if (!config) {
    throw new Error("SDK is not initialized");
  }

  let currentUser = getCurrentUser();
  let fromCache = false;
  if (config.cacheUser) {
    const cachedValue = retrieveData(USER_STORAGE_KEY);
    const cachedUser = isPumpRoomUser(cachedValue) ? cachedValue : null;
    if (cachedValue !== null && !cachedUser && typeof localStorage !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY);
    } else if (cachedUser && (await verifyCachedUser(cachedUser))) {
      currentUser = cachedUser;
      fromCache = true;
    } else if (cachedUser && typeof localStorage !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  if (!fromCache) {
    const apiClient = getApiClient();

    // Validate GetCourse placeholders if requested via init configuration
    if (config.type === "getcourse") {
      const uid = identity.id;
      const hasCurly = typeof uid === "string" && uid.indexOf("{") !== -1;
      const invalid = !uid || hasCurly;
      if (invalid) {
        const msg =
          "Некорректный идентификатор пользователя из GetCourse. При встраивании JavaScript-кода включите галочку «Заменять переменные пользователя».";
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          try {
            window.alert(msg);
          } catch {
            /* ignore */
          }
        } else {
          console.warn(msg);
        }
        throw new Error("GetCourse UID validation failed");
      }
    }

    currentUser = await apiClient.authenticate({ identity }, config.realm);

    if (config.cacheUser) {
      storeData(USER_STORAGE_KEY, currentUser);
    }
  }

  if (!currentUser) {
    throw new Error("Authentication failed");
  }

  if (!isAutoListenerRegistered()) {
    window.addEventListener("message", defaultUserListener);
    registerAutoListener();
  }

  setCurrentUser(currentUser);

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
 * @throws Error if the SDK is not initialized
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
export async function setUser(user: Omit<PumpRoomUser, "is_admin">): Promise<PumpRoomUser | null> {
  const config = getConfig();
  if (!config) {
    throw new Error("SDK is not initialized");
  }

  let verified: PumpRoomUser;

  try {
    const apiClient = getApiClient();
    const result = await apiClient.verifyToken({ ...user, is_admin: false }, config.realm);

    if (!result.is_valid) {
      console.error("Invalid user passed to setUser");
      return null;
    }

    verified = { ...user, is_admin: result.is_admin };
  } catch (err) {
    console.error("Verification error", err);
    return null;
  }

  if (config.cacheUser) {
    storeData(USER_STORAGE_KEY, verified);
  }
  setCurrentUser(verified);

  if (!isAutoListenerRegistered()) {
    window.addEventListener("message", defaultUserListener);
    registerAutoListener();
  }

  return verified;
}

/**
 * Default event listener for handling user-related messages
 *
 * @param event - The message event
 * @internal
 */
function defaultUserListener(event: MessageEvent): void {
  const data = getPumpRoomEventMessage(event, "getPumpRoomUser");
  if (!data) return;
  const user = getCurrentUser();
  if (!user) return;
  if (event.source) {
    const message: SetPumpRoomUserMessage = {
      service: "pumproom",
      type: "setPumpRoomUser",
      payload: user,
    };
    (event.source as Window).postMessage(message, event.origin);
  }
}
