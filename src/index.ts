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

interface PumpRoomConfig {
  authUrl: string;
  apiKey: string;
  allowedOrigins: string[];
}

let config: PumpRoomConfig | null = null;
let currentUser: PumpRoomUser | null = null;

/**
 * Initializes SDK configuration.
 */
export function init(cfg: PumpRoomConfig): void {
  config = { ...cfg };
}

/**
 * Authenticates current LMS user via PumpRoom API.
 */
export async function authenticate(): Promise<PumpRoomUser | null> {
  if (!config) {
    throw new Error('SDK is not initialized');
  }
  const profileGetter = (window.parent as any).tma__getProfileObjFromLS;
  if (typeof profileGetter !== 'function') {
    document.dispatchEvent(new CustomEvent('itAuthenticationCompleted', { detail: null }));
    return null;
  }
  try {
    const response = await fetch(config.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.apiKey
      },
      body: JSON.stringify({
        profile: profileGetter(),
        url: window.location.href
      })
    });
    if (response.ok) {
      currentUser = await response.json();
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
  if (!config) return false;
  return config.allowedOrigins.some(o =>
    o.startsWith('http') ? origin === o : origin.endsWith(o)
  );
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
