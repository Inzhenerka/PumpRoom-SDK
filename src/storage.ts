import type { PumpRoomUser } from './types';

export function readCachedUser(): PumpRoomUser | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem('pumproomUser');
        return raw ? (JSON.parse(raw) as PumpRoomUser) : null;
    } catch (err) {
        console.error('Cache read error', err);
        return null;
    }
}

export function saveCachedUser(user: PumpRoomUser): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem('pumproomUser', JSON.stringify(user));
    } catch (err) {
        console.error('Cache save error', err);
    }
}
