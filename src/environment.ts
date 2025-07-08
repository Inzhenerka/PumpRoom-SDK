/**
 * Environment management module for PumpRoom SDK
 *
 * This module handles environment information for PumpRoom,
 * including sending environment details to PumpRoom iframes
 * and setting up listeners for environment-related messages.
 *
 * @module Environment
 */
import {getPumpRoomEventMessage} from './messaging.ts';
import {getVersion} from './version.ts';
import type {OnInitCallback} from './types/index.ts';
import type {SetEnvironmentMessage} from './types/messages.js';
import {registerInstance} from './instance.ts';

/** Stores the callback function to be executed on initialization */
let onInitCallback: OnInitCallback | null = null;

/**
 * Sets a callback function to be executed on initialization
 *
 * This function allows setting a callback that will be executed immediately
 * after processing the getEnvironment message, with the instanceContext passed to it.
 * The callback can be either synchronous or asynchronous (async function).
 *
 * @param callback - The callback function to execute on initialization (can be async)
 * @example
 * ```typescript
 * // Set a synchronous callback to be executed on initialization
 * setOnInitCallback((instanceContext) => {
 *   console.log('Instance initialized:', instanceContext);
 *   // Perform actions with the instanceContext
 *   console.log('Instance UID:', instanceContext.instanceUid);
 *   console.log('Repository:', instanceContext.repoName);
 *   console.log('Task:', instanceContext.taskName);
 * });
 *
 * // Set an asynchronous callback to be executed on initialization
 * setOnInitCallback(async (instanceContext) => {
 *   console.log('Instance initialized:', instanceContext);
 *   // Perform async actions with the instanceContext
 *   await someAsyncOperation(instanceContext);
 *   console.log('Async operations completed');
 * });
 * ```
 */
export function setOnInitCallback(callback: OnInitCallback): void {
    onInitCallback = callback;
}

/**
 * Environment information sent to PumpRoom iframes
 */
export interface PumpRoomEnvironment {
    /** The URL of the page containing the SDK */
    pageURL: string;
    /** The version of the SDK */
    sdkVersion: string;
}

/**
 * Builds the environment information object
 *
 * @returns The environment information
 * @internal
 */
function buildEnvironment(): PumpRoomEnvironment {
    return {
        pageURL: window.location.href,
        sdkVersion: getVersion(),
    };
}

/**
 * Sends environment information to a target window
 *
 * @param target - The window to send the environment information to
 * @param origin - The origin of the target window
 */
export function sendEnvironment(target: Window, origin: string): void {
    const message: SetEnvironmentMessage = {
        service: 'pumproom',
        type: 'setEnvironment',
        payload: buildEnvironment(),
    }
    target.postMessage(message, origin);
}

/**
 * Handles environment-related messages from PumpRoom iframes
 *
 * @param event - The message event
 * @internal
 */
function handleEnvironmentMessage(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event, 'getEnvironment');
    if (!data) return
    // Register the instance using the instance module
    registerInstance(data.payload);

    if (event.source) {
        sendEnvironment(event.source as Window, event.origin);
    }

    // Execute the on init callback if it's set
    if (onInitCallback) {
        // Call the callback, which may return a Promise
        const result = onInitCallback(data.payload);
        // No need to await the Promise as we're not using the result
    }
}

/**
 * Sets up a listener for environment-related messages
 *
 * This function adds an event listener to the window to handle
 * messages requesting environment information from PumpRoom iframes.
 */
export function setEnvironmentListener(): void {
    window.addEventListener('message', handleEnvironmentMessage);
}
