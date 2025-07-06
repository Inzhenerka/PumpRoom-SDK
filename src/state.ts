/**
 * State management module for PumpRoom SDK
 * 
 * This module manages the internal state of the SDK, including configuration,
 * current user, and event listener registration status.
 * 
 * @module State
 */
import type {PumpRoomUser, PumpRoomConfig, InternalConfig} from './types.ts';

/** Internal configuration storage */
let config: InternalConfig | null = null;
/** Current authenticated user */
let currentUser: PumpRoomUser | null = null;
/** Flag indicating whether the auto listener has been registered */
let autoListenerRegistered = false;

/**
 * Sets the SDK configuration
 * 
 * @param cfg - The configuration object provided by the user
 */
export function setConfig(cfg: PumpRoomConfig): void {
    const {cacheUser = true, ...rest} = cfg;
    config = {...rest, cacheUser};
}

/**
 * Gets the current SDK configuration
 * 
 * @returns The current configuration or null if not set
 */
export function getConfig(): InternalConfig | null {
    return config;
}

/**
 * Sets the current authenticated user
 * 
 * @param user - The authenticated user or null to clear
 */
export function setCurrentUser(user: PumpRoomUser | null): void {
    currentUser = user;
}

/**
 * Gets the current authenticated user
 * 
 * @returns The current user or null if not authenticated
 */
export function getCurrentUser(): PumpRoomUser | null {
    return currentUser;
}

/**
 * Checks if the automatic message listener is registered
 * 
 * @returns True if the listener is registered, false otherwise
 */
export function isAutoListenerRegistered(): boolean {
    return autoListenerRegistered;
}

/**
 * Marks the automatic message listener as registered
 */
export function registerAutoListener(): void {
    autoListenerRegistered = true;
}
