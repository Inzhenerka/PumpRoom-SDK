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
    const env = buildEnvironment();
    target.postMessage({service: 'pumproom', type: 'setEnvironment', payload: env}, origin);
}

/**
 * Handles environment-related messages from PumpRoom iframes
 * 
 * @param event - The message event
 * @internal
 */
function handleEnvironmentMessage(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event);
    if (data?.type === 'getEnvironment') {
        if (event.source) {
            sendEnvironment(event.source as Window, event.origin);
        }
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
