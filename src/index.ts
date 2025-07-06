/**
 * PumpRoom SDK - Main entry point
 *
 * This module provides the main functionality for integrating with the PumpRoom platform.
 * It handles initialization, authentication, and user management.
 *
 * @module PumpRoomSDK
 */

import {setConfig} from './state.js';
import {setFullscreenListener} from './fullscreen.ts';
import {enforceIframeHeight} from './iframe.ts';
import {setEnvironmentListener} from './environment.ts';
import {getVersion} from './version.ts';
import {PumpRoomConfig} from './types.ts';
import {initApiClient} from './api-client.ts';

export {getCurrentUser} from './state.ts';
export {authenticate, setUser} from './auth.ts';
export {getVersion} from './version.ts';
export type {
    PumpRoomConfig, PumpRoomUser, AuthenticateOptions, LMSProfileInput, TildaProfileInput, CourseInput
} from './types.ts';

console.debug('PumpRoom SDK v' + getVersion() + ' loaded');

/**
 * Initializes the PumpRoom SDK with the provided configuration.
 *
 * This function must be called before using any other SDK functionality.
 * It sets up the API client, event listeners, and iframe configuration.
 *
 * @param cfg - The SDK configuration object
 * @example
 * ```typescript
 * import { init } from 'pumproom-sdk';
 *
 * init({
 *   apiKey: 'your-api-key',
 *   realm: 'your-realm',
 *   cacheUser: true,
 *   minHeight: 500
 * });
 * ```
 */
export function init(cfg: PumpRoomConfig): void {
    setConfig(cfg);
    initApiClient(cfg.apiKey);
    setFullscreenListener();
    setEnvironmentListener();
    if (cfg.minHeight) {
        enforceIframeHeight(cfg.minHeight);
    }
}
