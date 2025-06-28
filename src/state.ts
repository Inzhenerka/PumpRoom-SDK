import type { PumpRoomUser } from './types';
import { handleFullscreenToggle } from './fullscreen';

export interface PumpRoomConfig {
    apiKey: string;
    realm: string;
    cacheUser?: boolean;
}

export type InternalConfig = Required<PumpRoomConfig>;

let config: InternalConfig | null = null;
let currentUser: PumpRoomUser | null = null;
let autoListenerRegistered = false;

export function init(cfg: PumpRoomConfig): void {
    const { cacheUser = true, ...rest } = cfg;
    config = { ...rest, cacheUser };
    handleFullscreenToggle();
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
