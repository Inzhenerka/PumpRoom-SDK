import {PUMPROOM_DOMAINS} from './constants.ts';
import {getPumpRoomEventMessage} from './messaging.ts';

let savedScroll = 0;
let fullscreenInitialized = false;

export function handleFullscreenToggle(): void {
    if (fullscreenInitialized) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY) {
            savedScroll = window.scrollY;
        }
    });

    window.addEventListener('message', (event: MessageEvent) => {
        const data = getPumpRoomEventMessage(event);
        if (!data) return;
        if (data.type === 'toggleFullscreen' && data.payload?.fullscreenState === false) {
            window.scrollTo({
                top: savedScroll || 0,
                left: 0,
                behavior: 'instant',
            });
        }
    });
    fullscreenInitialized = true;
}

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
