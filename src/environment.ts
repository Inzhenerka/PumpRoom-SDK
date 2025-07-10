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
import type {SetEnvironmentMessage} from './types/messages.js';
import {registerTaskInstance} from './instance.ts';
import {executeOnInitCallback} from './callbacks.ts';

// The setOnInitCallback function has been moved to callbacks.ts

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
 * Sends environment information to a target window.
 *
 * This helper is mostly used internally when the SDK receives an
 * {@link GetEnvironmentMessage}. It can also be used in custom integrations
 * to manually send environment data to an iframe.
 *
 * @param target - The window to send the environment information to
 * @param origin - The origin of the target window
 *
 * @example
 * ```typescript
 * const iframe = document.querySelector('iframe')!;
 * sendEnvironment(iframe.contentWindow!, '*');
 * ```
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
    registerTaskInstance(data.payload.instanceContext);

    if (event.source) {
        sendEnvironment(event.source as Window, event.origin);
    }

    // Execute the on init callback if it's set (using the callbacks module)
    executeOnInitCallback(data.payload);
}

/**
 * Sets up a listener for environment-related messages.
 *
 * After calling this function the SDK will automatically respond to
 * environment requests coming from embedded PumpRoom iframes.
 *
 * @example
 * ```typescript
 * setEnvironmentListener();
 * ```
 */
export function setEnvironmentListener(): void {
    window.addEventListener('message', handleEnvironmentMessage);
}
