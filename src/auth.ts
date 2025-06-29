import type { TildaProfileInput, AuthInput, PumpRoomUser, VerifyTokenInput, VerifyTokenResult } from './types.ts';
import { AUTH_URL, VERIFY_URL, userStorageKey } from './constants.ts';
import { retrieveData, storeData } from './storage.ts';
import {
    getConfig,
    setCurrentUser,
    getCurrentUser,
    registerAutoListener,
    isAutoListenerRegistered,
} from './state.ts';
import { getPumpRoomEventMessage, sendUser } from './messaging.ts';

async function verifyCachedUser(user: PumpRoomUser): Promise<boolean> {
    const config = getConfig();
    if (!config) return false;

    const payload: VerifyTokenInput = {
        realm: config.realm,
        token: user.token,
        uid: user.uid,
    };

    try {
        const resp = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': config.apiKey,
            },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) return false;
        const result = (await resp.json()) as VerifyTokenResult;
        if (result.is_valid) {
            user.is_admin = result.is_admin;
            storeData(userStorageKey, user);
        }
        return result.is_valid;
    } catch (err) {
        console.error('Verification error', err);
        return false;
    }
}

export async function authenticate(profile: TildaProfileInput): Promise<PumpRoomUser | null> {
    const config = getConfig();
    if (!config) {
        throw new Error('SDK is not initialized');
    }

    let currentUser = getCurrentUser();
    let fromCache = false;
    if (config.cacheUser) {
        const cachedUser = retrieveData(userStorageKey) as PumpRoomUser;
        if (cachedUser && (await verifyCachedUser(cachedUser))) {
            currentUser = cachedUser;
            fromCache = true;
        } else if (cachedUser && typeof localStorage !== 'undefined') {
            localStorage.removeItem(userStorageKey);
        }
    }

    if (!fromCache) {
        try {
            const body: AuthInput = {
                profile,
                realm: config.realm,
                url: window.location.href,
            };
            const response = await fetch(AUTH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': config.apiKey,
                },
                body: JSON.stringify(body),
            });
            if (response.ok) {
                currentUser = (await response.json()) as PumpRoomUser;
                if (config.cacheUser) {
                    storeData(userStorageKey, currentUser);
                }
            } else {
                console.error('Authentication failed', response.status);
            }
        } catch (err) {
            console.error('Network error', err);
        }
    }

    if (currentUser && !isAutoListenerRegistered()) {
        window.addEventListener('message', defaultUserListener);
        registerAutoListener();
    }

    setCurrentUser(currentUser || null);

    document.dispatchEvent(new CustomEvent('itAuthenticationCompleted', { detail: currentUser }));

    return currentUser || null;
}

function defaultUserListener(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event);
    if (!data) return;
    const user = getCurrentUser();
    if (!user) return;
    if (data.type === 'getPumpRoomUser') {
        sendUser(event.source as Window, event.origin);
    }
}
