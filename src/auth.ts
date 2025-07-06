import type {
    PumpRoomUser,
    AuthenticateOptions,
    LMSProfileInput,
} from './types.ts';
import {userStorageKey} from './constants.ts';
import {retrieveData, storeData} from './storage.ts';
import {
    getConfig,
    setCurrentUser,
    getCurrentUser,
    registerAutoListener,
    isAutoListenerRegistered,
} from './state.ts';
import {getPumpRoomEventMessage, sendUser} from './messaging.ts';
import {getApiClient} from './api-client.ts';

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLmsProfile(lms?: LMSProfileInput | null): LMSProfileInput | null | undefined {
    if (!lms) return lms;

    if (lms.id && lms.email) {
        console.warn('LMS email provided along with id; email will be ignored');
    } else if (!lms.id && lms.email) {
        if (isValidEmail(lms.email)) {
            lms.id = lms.email;
        } else {
            console.warn('Invalid email supplied to LMS profile');
        }
    }

    return lms;
}

async function verifyCachedUser(user: PumpRoomUser): Promise<boolean> {
    const config = getConfig();
    if (!config) return false;

    try {
        const apiClient = getApiClient();
        const result = await apiClient.verifyToken(user, config.realm);

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

export async function authenticate({lms, profile}: AuthenticateOptions = {}): Promise<PumpRoomUser | null> {
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
            const apiClient = getApiClient();
            const normLms = normalizeLmsProfile(lms);
            currentUser = await apiClient.authenticate({ lms: normLms, profile }, config.realm);

            if (currentUser && config.cacheUser) {
                storeData(userStorageKey, currentUser);
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

    document.dispatchEvent(new CustomEvent('itAuthenticationCompleted', {detail: currentUser}));

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
