/**
 * Global state management module for PumpRoom SDK
 * 
 * This module manages the internal state of the SDK, including configuration,
 * current user, event listener registration status, and other global variables.
 * 
 * @module Globals
 */
import type {PumpRoomUser, PumpRoomConfig, InternalConfig, InstanceContext} from './types/index.ts';
import type {OnInitCallback, OnTaskLoadedCallback, OnTaskSubmittedCallback, OnResultReadyCallback} from './types/index.ts';
import type {ApiClient} from './api-client.ts';

/** Internal configuration storage */
let config: InternalConfig | null = null;
/** Current authenticated user */
let currentUser: PumpRoomUser | null = null;
/** Flag indicating whether the auto listener has been registered */
let autoListenerRegistered = false;
/** Saved scroll position to restore when exiting fullscreen mode */
let savedScroll = 0;
/** Flag to prevent multiple initializations of the fullscreen listener */
let fullscreenInitialized = false;
/** State for storing registered instances */
const instanceRegistry: Record<string, InstanceContext> = {};
/** Stores the callback function to be executed on initialization */
let onInitCallback: OnInitCallback | null = null;
/** Stores the callback function to be executed when a task is loaded */
let onTaskLoadedCallback: OnTaskLoadedCallback | null = null;
/** Stores the callback function to be executed when a task is submitted */
let onTaskSubmittedCallback: OnTaskSubmittedCallback | null = null;
/** Stores the callback function to be executed when a result is ready */
let onResultReadyCallback: OnResultReadyCallback | null = null;
/** Singleton instance of the API client */
let apiClientInstance: ApiClient | null = null;
/** List of registered state names */
let registeredStates: string[] = [];

/**
 * Sets the SDK configuration
 *
 * @param cfg - The configuration object provided by the user
 *
 * @example
 * ```typescript
 * setConfig({ apiKey: 'key', realm: 'academy', cacheUser: true });
 * ```
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
 *
 * @category Authentication
 * @public
 * @example
 * ```typescript
 * const user = getCurrentUser();
 * if (user) {
 *   console.log('Logged in as', user.uid);
 * }
 * ```
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
 *
 * @example
 * ```typescript
 * if (!isAutoListenerRegistered()) {
 *   registerAutoListener();
 * }
 * ```
 */
export function registerAutoListener(): void {
    autoListenerRegistered = true;
}

/**
 * Gets the saved scroll position
 * 
 * @returns The saved scroll position
 */
export function getSavedScroll(): number {
    return savedScroll;
}

/**
 * Sets the saved scroll position
 * 
 * @param scroll - The scroll position to save
 */
export function setSavedScroll(scroll: number): void {
    savedScroll = scroll;
}

/**
 * Checks if the fullscreen listener is initialized
 * 
 * @returns True if the fullscreen listener is initialized, false otherwise
 */
export function isFullscreenInitialized(): boolean {
    return fullscreenInitialized;
}

/**
 * Marks the fullscreen listener as initialized
 */
export function setFullscreenInitialized(): void {
    fullscreenInitialized = true;
}

/**
 * Registers an instance context
 *
 * @param instanceContext - The instance context to register
 * @internal
 *
 * @example
 * ```typescript
 * registerInstance({ instanceUid: '1', repoName: 'repo', taskName: 'task', realm: 'test', tags: undefined });
 * ```
 */
export function registerTaskInstance(instanceContext: InstanceContext): void {
    if (instanceContext && instanceContext.instanceUid) {
        instanceRegistry[instanceContext.instanceUid] = instanceContext;
    }
}

/**
 * Gets all registered instances
 *
 * @returns A record mapping instance UIDs to their contexts
 *
 * @example
 * ```typescript
 * const instances = getInstances();
 * console.log(Object.keys(instances));
 * ```
 */
export function getTaskInstances(): Record<string, InstanceContext> {
    return {...instanceRegistry};
}

/**
 * Sets the callback function to be executed on initialization
 *
 * @param callback - The callback function to execute on initialization
 */
export function setOnInitCallback(callback: OnInitCallback): void {
    onInitCallback = callback;
}

/**
 * Gets the callback function to be executed on initialization
 * 
 * @returns The callback function or null if not set
 */
export function getOnInitCallback(): OnInitCallback | null {
    return onInitCallback;
}

/**
 * Sets the callback function to be executed when a task is loaded
 *
 * @param callback - The callback function to execute when a task is loaded
 */
export function setOnTaskLoadedCallback(callback: OnTaskLoadedCallback): void {
    onTaskLoadedCallback = callback;
}

/**
 * Gets the callback function to be executed when a task is loaded
 * 
 * @returns The callback function or null if not set
 */
export function getOnTaskLoadedCallback(): OnTaskLoadedCallback | null {
    return onTaskLoadedCallback;
}

/**
 * Sets the callback function to be executed when a task is submitted
 *
 * @param callback - The callback function to execute when a task is submitted
 */
export function setOnTaskSubmittedCallback(callback: OnTaskSubmittedCallback): void {
    onTaskSubmittedCallback = callback;
}

/**
 * Gets the callback function to be executed when a task is submitted
 * 
 * @returns The callback function or null if not set
 */
export function getOnTaskSubmittedCallback(): OnTaskSubmittedCallback | null {
    return onTaskSubmittedCallback;
}

/**
 * Sets the callback function to be executed when a result is ready
 *
 * @param callback - The callback function to execute when a result is ready
 */
export function setOnResultReadyCallback(callback: OnResultReadyCallback): void {
    onResultReadyCallback = callback;
}

/**
 * Gets the callback function to be executed when a result is ready
 * 
 * @returns The callback function or null if not set
 */
export function getOnResultReadyCallback(): OnResultReadyCallback | null {
    return onResultReadyCallback;
}

/**
 * Sets the API client instance
 * 
 * @param client - The API client instance
 */
export function setApiClientInstance(client: ApiClient): void {
    apiClientInstance = client;
}

/**
 * Gets the API client instance
 * 
 * @returns The API client instance or null if not set
 * @throws Error if the API client is not initialized
 */
export function getApiClientInstance(): ApiClient {
    if (!apiClientInstance) {
        throw new Error('API client is not initialized. Call initApiClient first.');
    }
    return apiClientInstance;
}

/**
 * Registers state names for tracking
 * 
 * This function adds the provided state names to the list of registered states
 * if they are not already registered.
 * 
 * @param stateNames - Array of state names to register
 * @throws Error if stateNames is not an array
 *
 * @experimental
 * @example
 * ```typescript
 * registerStates(['userPreferences', 'lastVisitedPage']);
 * ```
 */
export function registerStates(stateNames: string[]): void {
    if (!Array.isArray(stateNames)) {
        throw new Error('stateNames must be an array');
    }

    stateNames.forEach(state => {
        if (!registeredStates.includes(state)) {
            registeredStates.push(state);
        }
    });
}

/**
 * Gets the list of registered state names
 * 
 * @returns Array of registered state names
 *
 * @category States
 * @experimental
 * @example
 * ```typescript
 * const states = getRegisteredStates();
 * console.log(states); // ['userPreferences', 'lastVisitedPage']
 * ```
 */
export function getRegisteredStates(): string[] {
    return [...registeredStates];
}

/**
 * Resets the list of registered state names
 * 
 * This function is primarily used for testing purposes.
 *
 * @experimental
 * @internal
 */
export function resetRegisteredStates(): void {
    registeredStates = [];
}
