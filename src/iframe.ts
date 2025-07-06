/**
 * IFrame management module for PumpRoom SDK
 * 
 * This module provides utilities for working with PumpRoom iframes,
 * including height enforcement to ensure proper display.
 * 
 * @module IFrame
 */
import {PUMPROOM_DOMAINS} from './constants.ts';

/**
 * Checks if an iframe is a PumpRoom iframe based on its source URL
 * 
 * @param iframe - The iframe element to check
 * @returns True if the iframe is a PumpRoom iframe, false otherwise
 * @internal
 */
function isPumpRoomIframe(iframe: HTMLIFrameElement): boolean {
    return PUMPROOM_DOMAINS.some(domain => iframe.src.startsWith(domain));
}

/**
 * Enforces a minimum height on all PumpRoom iframes in the document
 * 
 * This function finds all iframes in the document that point to PumpRoom domains
 * and ensures they have at least the specified minimum height.
 * 
 * @param minHeight - The minimum height in pixels (default: 600)
 * @example
 * ```typescript
 * import { enforceIframeHeight } from 'pumproom-sdk';
 * 
 * // Ensure all PumpRoom iframes are at least 800px tall
 * enforceIframeHeight(800);
 * ```
 */
export function enforceIframeHeight(minHeight = 600): void {
    document.querySelectorAll('iframe').forEach((iframe) => {
        if (isPumpRoomIframe(iframe)) {
            const heightAttr = iframe.getAttribute('height');
            if (heightAttr) {
                const heightValue = parseInt(heightAttr, 10);
                if (!Number.isNaN(heightValue) && heightValue < minHeight) {
                    iframe.setAttribute('height', `${minHeight}px`);
                }
            }
        }
    });
}
