/**
 * PumpRoom user information returned by authentication endpoint.
 */
export interface PumpRoomUser {
  id: number;
  token: string;
  email: string;
}

/**
 * PumpRoom postMessage structure.
 */
export interface PumpRoomMessage {
  service: 'pumproom';
  type: string;
  payload?: any;
}

const AUTH_URL =
  'https://pumproom-api.inzhenerka-cloud.com/tracker/authenticate';

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
}

let config: PumpRoomConfig | null = null;
let currentUser: PumpRoomUser | null = null;
let autoListenerRegistered = false;

/**
 * Initializes SDK configuration.
 */
export function init(cfg: PumpRoomConfig): void {
  config = { ...cfg };
}

/**
 * Authenticates current LMS user via PumpRoom API.
 */
export async function authenticate(profile: unknown): Promise<PumpRoomUser | null> {
  if (!config) {
    throw new Error('SDK is not initialized');
  }
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.apiKey
      },
      body: JSON.stringify({
        profile,
        realm: config.realm,
        url: window.location.href
      })
    });
    if (response.ok) {
      currentUser = await response.json();
      if (!autoListenerRegistered) {
        window.addEventListener('message', defaultUserListener);
        autoListenerRegistered = true;
      }
    } else {
      console.error('Authentication failed', response.status);
    }
  } catch (err) {
    console.error('Network error', err);
  } finally {
    document.dispatchEvent(new CustomEvent('itAuthenticationCompleted', { detail: currentUser }));
  }
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
