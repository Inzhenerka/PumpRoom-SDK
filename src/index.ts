import type {
  PumpRoomUser,
  PumpRoomMessage,
  CourseInput,
  TildaProfileInput,
  RealmPayload,
  AuthInput,
  AuthResult,
  IdentityProviderType
} from './types';

const AUTH_URL =
  'https://pumproom-api.inzhenerka-cloud.com/tracker/authenticate';
const VERIFY_URL =
  'https://pumproom-api.inzhenerka-cloud.com/tracker/verify_token';

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
  const { cacheUser = true, ...rest } = cfg;
  config = { ...rest, cacheUser };
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
  try {
    const resp = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.apiKey,
      },
      body: JSON.stringify({ realm: config.realm, token: user.token }),
    });
    return resp.ok;
  } catch (err) {
    console.error('Verification error', err);
    return false;
  }
}

/**
 * Authenticates current LMS user via PumpRoom API.
 */
export async function authenticate(profile: unknown): Promise<PumpRoomUser | null> {
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
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': config.apiKey,
        },
        body: JSON.stringify({
          profile,
          realm: config.realm,
          url: window.location.href,
        }),
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
    new CustomEvent('itAuthenticationCompleted', { detail: currentUser })
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
 * Subscribes to PumpRoom messages.
 */
export function onMessage(handler: (msg: PumpRoomMessage, ev: MessageEvent) => void): void {
  window.addEventListener('message', ev => {
    if (!isAllowedOrigin(ev.origin)) return;
    const data = ev.data as PumpRoomMessage;
    if (!data || data.service !== 'pumproom') return;
    handler(data, ev);
  });
}

/**
 * Sends current user back to event source if defined.
 */
export function sendUser(target: Window, origin: string): void {
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
