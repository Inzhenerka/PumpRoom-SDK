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
import { API_BASE_URL, USER_STORAGE_KEY } from "./constants.ts";
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

interface AuthContext {
  realm: string;
  provider: AuthenticateOptions["identity"]["provider"];
  id: string;
  apiBaseUrl?: string;
}

type CachedUser = PumpRoomUser & {
  cacheVersion?: unknown;
  authContext?: Partial<AuthContext> | null;
};

// Both authentication entry points share a generation so stale responses cannot
// publish credentials after a newer login attempt or configuration change.
let authGeneration = 0;

function withoutCacheMetadata(user: CachedUser): PumpRoomUser {
  const result = { ...user };
  delete result.cacheVersion;
  delete result.authContext;
  return result;
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
export async function authenticate({
  identity,
  signal,
}: AuthenticateOptions): Promise<PumpRoomUser> {
  const assertNotAborted = () => {
    if (signal?.aborted) throw new DOMException("Authentication aborted", "AbortError");
  };
  assertNotAborted();
  const config = getConfig();
  if (!config) {
    throw new Error("SDK is not initialized");
  }

  const generation = ++authGeneration;
  setCurrentUser(null);
  const assertCurrent = (): void => {
    assertNotAborted();
    if (generation !== authGeneration || getConfig() !== config) {
      throw new Error("Authentication superseded by a newer request or configuration");
    }
  };

  // Validate before considering cached credentials, including legacy records.
  if (
    config.type === "getcourse" &&
    (typeof identity?.id !== "string" || !identity.id.trim() || identity.id.includes("{"))
  ) {
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
  if (
    !identity ||
    typeof identity.id !== "string" ||
    !identity.id.trim() ||
    (identity.provider !== "lms" && identity.provider !== "telegram")
  ) {
    throw new Error("Invalid user identity");
  }

  const authContext: AuthContext = {
    realm: config.realm,
    provider: identity.provider,
    id: identity.id,
    ...(config.apiBaseUrl !== API_BASE_URL ? { apiBaseUrl: config.apiBaseUrl } : {}),
  };
  const apiClient = getApiClient();
  let currentUser: PumpRoomUser | null = null;
  if (config.cacheUser) {
    const cachedValue = retrieveData(USER_STORAGE_KEY);
    const cachedUser: CachedUser | null = isPumpRoomUser(cachedValue) ? cachedValue : null;
    if (
      cachedUser?.cacheVersion === 2 &&
      cachedUser.authContext?.realm === authContext.realm &&
      cachedUser.authContext?.provider === authContext.provider &&
      cachedUser.authContext?.id === authContext.id &&
      (cachedUser.authContext?.apiBaseUrl ?? API_BASE_URL) === config.apiBaseUrl
    ) {
      const result = await apiClient.verifyToken(
        withoutCacheMetadata(cachedUser),
        config.realm,
        signal,
      );
      assertCurrent();
      if (result.is_valid) {
        currentUser = { ...withoutCacheMetadata(cachedUser), is_admin: result.is_admin };
      }
    }
  }

  // Unbound legacy records must be resolved by identity, never adopted blindly.
  // Preserve storage on failures so migration can be retried on the next call.
  if (!currentUser) {
    const result = await apiClient.authenticate(
      { identity, ...(signal ? { signal } : {}) },
      config.realm,
    );
    assertCurrent();
    if (!isPumpRoomUser(result)) throw new Error("Authentication failed");
    currentUser = withoutCacheMetadata(result);
  }
  if (config.cacheUser) {
    storeData(USER_STORAGE_KEY, { ...currentUser, cacheVersion: 2, authContext });
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

  const generation = ++authGeneration;
  setCurrentUser(null);
  let verified: PumpRoomUser;

  try {
    const apiClient = getApiClient();
    const result = await apiClient.verifyToken({ ...user, is_admin: false }, config.realm);

    if (generation !== authGeneration || getConfig() !== config) return null;

    if (!result.is_valid) {
      console.error("Invalid user passed to setUser");
      return null;
    }

    verified = withoutCacheMetadata({ ...user, is_admin: result.is_admin });
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
