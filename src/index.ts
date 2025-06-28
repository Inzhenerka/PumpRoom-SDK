import type {
    PumpRoomUser,
    PumpRoomMessage,
    CourseInput,
    TildaProfileInput,
    RealmPayload,
    AuthInput,
    AuthResult,
    VerifyTokenInput,
    VerifyTokenResult,
    IdentityProviderType
} from './types';

const API_BASE_URL = 'https://pumproom-api.inzhenerka-cloud.com';
const AUTH_URL = API_BASE_URL + '/tracker/authenticate';
const VERIFY_URL = API_BASE_URL + '/tracker/verify_token';

const ALLOWED_ORIGINS = [
    '.inzhenerka-cloud.com',
    '.inzhenerka.tech',
    '.pumproom.tech',
    'https://inzhenerka.tech',
    'https://pumproom.tech',
    'http://127.0.0.1:8002',
];

interface PumpRoomConfig {
    apiKey: string;
    realm: string;
    cacheUser?: boolean;
}

type InternalConfig = Required<PumpRoomConfig>;
let config: InternalConfig | null = null;
let currentUser: PumpRoomUser | null = null;
let autoListenerRegistered = false;

/**
 * Initializes SDK configuration.
 */
export function init(cfg: PumpRoomConfig): void {
    const {cacheUser = true, ...rest} = cfg;
    config = {...rest, cacheUser};
}

function readCachedUser(): PumpRoomUser | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem('pumproomUser');
        return raw ? (JSON.parse(raw) as PumpRoomUser) : null;
    } catch (err) {
        console.error('Cache read error', err);
        return null;
    }
}

function saveCachedUser(user: PumpRoomUser): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem('pumproomUser', JSON.stringify(user));
    } catch (err) {
        console.error('Cache save error', err);
    }
}

async function verifyCachedUser(user: PumpRoomUser): Promise<boolean> {
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

/**
 * Authenticates current LMS user via PumpRoom API.
 */
export async function authenticate(profile: TildaProfileInput): Promise<PumpRoomUser | null> {
    if (!config) {
        throw new Error('SDK is not initialized');
    }

    let fromCache = false;
    if (config.cacheUser) {
        const cached = readCachedUser();
        if (cached && (await verifyCachedUser(cached))) {
            currentUser = cached;
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
            }
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
                    saveCachedUser(currentUser);
                }
            } else {
                console.error('Authentication failed', response.status);
            }
        } catch (err) {
            console.error('Network error', err);
        }
    }

    if (currentUser && !autoListenerRegistered) {
        window.addEventListener('message', defaultUserListener);
        autoListenerRegistered = true;
    }

    document.dispatchEvent(
        new CustomEvent('itAuthenticationCompleted', {detail: currentUser})
    );

    return currentUser;
}

function isAllowedOrigin(origin: string): boolean {
    return ALLOWED_ORIGINS.some((o) =>
        o.startsWith('http') ? origin === o : origin.endsWith(o)
    );
}

function defaultUserListener(ev: MessageEvent): void {
    if (!currentUser) return;
    if (!isAllowedOrigin(ev.origin)) return;
    const data = ev.data as PumpRoomMessage;
    if (data?.service === 'pumproom' && data.type === 'getPumpRoomUser') {
        sendUser(ev.source as Window, ev.origin);
    }
}


/**
 * Sends current user back to event source if defined.
 */
function sendUser(target: Window, origin: string): void {
    if (!currentUser) return;
    const message: PumpRoomMessage = {
        service: 'pumproom',
        type: 'setPumpRoomUser',
        payload: currentUser
    };
    target.postMessage(message, origin);
}

/**
 * Returns saved user object.
 */
export function getCurrentUser(): PumpRoomUser | null {
    return currentUser;
}

export * from './types';
