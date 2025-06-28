import type { TildaProfileInput, AuthInput, PumpRoomUser, VerifyTokenInput, VerifyTokenResult } from './types.ts';
import { AUTH_URL, VERIFY_URL } from './constants.ts';
import { readCachedUser, saveCachedUser } from './storage.ts';
import {
    getConfig,
    setCurrentUser,
    getCurrentUser,
    registerAutoListener,
    isAutoListenerRegistered,
} from './state.ts';
import type { PumpRoomMessage } from './types.ts';
import { sendUser, isAllowedOrigin } from './messaging.ts';

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
            saveCachedUser(user);
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

    let current = getCurrentUser();
    let fromCache = false;
    if (config.cacheUser) {
        const cached = readCachedUser();
        if (cached && (await verifyCachedUser(cached))) {
            current = cached;
            fromCache = true;
        } else if (cached && typeof localStorage !== 'undefined') {
            localStorage.removeItem('pumproomUser');
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
                current = (await response.json()) as PumpRoomUser;
                if (config.cacheUser) {
                    saveCachedUser(current);
                }
            } else {
                console.error('Authentication failed', response.status);
            }
        } catch (err) {
            console.error('Network error', err);
        }
    }

    if (current && !isAutoListenerRegistered()) {
        window.addEventListener('message', defaultUserListener);
        registerAutoListener();
    }

    setCurrentUser(current || null);

    document.dispatchEvent(new CustomEvent('itAuthenticationCompleted', { detail: current }));

    return current || null;
}

function defaultUserListener(ev: MessageEvent): void {
    const user = getCurrentUser();
    if (!user) return;
    if (!isAllowedOrigin(ev.origin)) return;
    const data = ev.data as PumpRoomMessage;
    if (data?.service === 'pumproom' && data.type === 'getPumpRoomUser') {
        sendUser(ev.source as Window, ev.origin);
    }
}
