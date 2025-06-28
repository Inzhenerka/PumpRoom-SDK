import type { PumpRoomMessage } from './types';

let savedScroll = 0;
let fullscreenHandled = false;

export function handleFullscreenToggle(): void {
    if (fullscreenHandled) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY) {
            savedScroll = window.scrollY;
        }
    });

    window.addEventListener('message', (event: MessageEvent) => {
        const data = event.data as PumpRoomMessage & { state?: boolean };
        if (data?.service !== 'pumproom') return;
        console.debug('[->] PumpRoom message', event);
        if (data.type === 'toggleFullscreen' && data.state === false) {
            window.scrollTo({
                top: savedScroll || 0,
                left: 0,
                behavior: 'instant',
            });
        }
    });

    fullscreenHandled = true;
}

export function enforceIframeHeight(minHeight = 600): void {
    document.querySelectorAll('iframe').forEach((frame) => {
        const src = (frame as HTMLIFrameElement).src;
        if (
            src.startsWith('https://pumproom.') ||
            src.startsWith('https://pump-room.') ||
            src.startsWith('https://dev.pumproom.')
        ) {
            const heightAttr = frame.getAttribute('height');
            if (heightAttr) {
                const heightValue = parseInt(heightAttr, 10);
                if (!Number.isNaN(heightValue) && heightValue < minHeight) {
                    frame.setAttribute('height', `${minHeight}px`);
                }
            }
        }
    });
}
