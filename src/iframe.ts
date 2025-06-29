import {PUMPROOM_DOMAINS} from './constants.ts';

function isPumpRoomIframe(iframe: HTMLIFrameElement): boolean {
    return PUMPROOM_DOMAINS.some(domain => iframe.src.startsWith(domain));
}

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
