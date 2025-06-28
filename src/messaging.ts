import type { PumpRoomMessage } from './types.ts';
import { ALLOWED_ORIGINS } from './constants.ts';
import { getCurrentUser } from './state.ts';

export function isAllowedOrigin(origin: string): boolean {
    return ALLOWED_ORIGINS.some((o) =>
        o.startsWith('http') ? origin === o : origin.endsWith(o),
    );
}

export function sendUser(target: Window, origin: string): void {
    const user = getCurrentUser();
    if (!user) return;
    const message: PumpRoomMessage = {
        service: 'pumproom',
        type: 'setPumpRoomUser',
        payload: user,
    };
    target.postMessage(message, origin);
}
