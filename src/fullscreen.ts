/**
 * Fullscreen management module for PumpRoom SDK
 * 
 * This module handles fullscreen functionality for PumpRoom iframes,
 * including saving and restoring scroll position when toggling fullscreen mode.
 * 
 * @module Fullscreen
 */
import {getPumpRoomEventMessage} from './messaging.ts';

/** Saved scroll position to restore when exiting fullscreen mode */
let savedScroll = 0;
/** Flag to prevent multiple initializations of the fullscreen listener */
let fullscreenInitialized = false;

/**
 * Sets up event listeners for handling fullscreen mode
 * 
 * This function sets up two event listeners:
 * 1. A scroll listener to save the current scroll position
 * 2. A message listener to restore the scroll position when exiting fullscreen mode
 * 
 * The function ensures that the listeners are only initialized once.
 */
export function setFullscreenListener(): void {
    if (fullscreenInitialized) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY) {
            savedScroll = window.scrollY;
        }
    });

    window.addEventListener('message', (event: MessageEvent) => {
        const data = getPumpRoomEventMessage(event, 'toggleFullscreen');
        if (!data) return;
        if (!data.payload.fullscreenState) {
            window.scrollTo({
                top: savedScroll || 0,
                left: 0,
                behavior: 'instant',
            });
        }
    });
    fullscreenInitialized = true;
}
