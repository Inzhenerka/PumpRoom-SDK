/**
 * Fullscreen management module for PumpRoom SDK
 * 
 * This module handles fullscreen functionality for PumpRoom iframes,
 * including saving and restoring scroll position when toggling fullscreen mode.
 * 
 * @module Fullscreen
 */
import {getPumpRoomEventMessage} from './messaging.ts';
import {
    getSavedScroll,
    setSavedScroll,
    isFullscreenInitialized,
    setFullscreenInitialized
} from './globals.ts';

/**
 * Sets up event listeners for handling fullscreen mode
 * 
 * This function sets up two event listeners:
 * 1. A scroll listener to save the current scroll position
 * 2. A message listener to restore the scroll position when exiting fullscreen mode
 *
 * The function ensures that the listeners are only initialized once.
 *
 * @example
 * ```typescript
 * // Enable fullscreen scroll preservation
 * setFullscreenListener();
 * ```
 */
export function setFullscreenListener(): void {
    if (isFullscreenInitialized()) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY) {
            setSavedScroll(window.scrollY);
        }
    });

    window.addEventListener('message', (event: MessageEvent) => {
        const data = getPumpRoomEventMessage(event, 'toggleFullscreen');
        if (!data) return;
        if (!data.payload.fullscreenState) {
            window.scrollTo({
                top: getSavedScroll() || 0,
                left: 0,
                behavior: 'instant',
            });
        }
    });
    setFullscreenInitialized();
}
