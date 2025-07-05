import {PUMPROOM_DOMAINS} from './constants.ts';
import {getPumpRoomEventMessage} from './messaging.ts';

let savedScroll = 0;
let fullscreenInitialized = false;

export function setFullscreenListener(): void {
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
