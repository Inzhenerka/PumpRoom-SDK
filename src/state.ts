import type {PumpRoomUser, PumpRoomConfig, InternalConfig} from './types.ts';

let config: InternalConfig | null = null;
let currentUser: PumpRoomUser | null = null;
let autoListenerRegistered = false;

export function setConfig(cfg: PumpRoomConfig): void {
    const {cacheUser = true, ...rest} = cfg;
    config = {...rest, cacheUser};
}

export function getConfig(): InternalConfig | null {
    return config;
}

export function setCurrentUser(user: PumpRoomUser | null): void {
    currentUser = user;
}

export function getCurrentUser(): PumpRoomUser | null {
    return currentUser;
}

export function isAutoListenerRegistered(): boolean {
    return autoListenerRegistered;
}

export function registerAutoListener(): void {
    autoListenerRegistered = true;
}
