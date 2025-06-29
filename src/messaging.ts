import type {PumpRoomMessage} from './types.ts';
import {getCurrentUser} from './state.ts';

export function getPumpRoomEventMessage(event: MessageEvent): PumpRoomMessage | null {
    if (event.data?.service !== 'pumproom') return null;
    if (!event.data?.type) return null;
    return event.data;
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
