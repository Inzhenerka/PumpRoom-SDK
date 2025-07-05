export const API_BASE_URL = 'https://pumproom-api.inzhenerka-cloud.com';
export const AUTH_URL = `${API_BASE_URL}/tracker/authenticate`;
export const VERIFY_URL = `${API_BASE_URL}/tracker/verify_token`;
export const PUMPROOM_DOMAINS = [
    'https://pumproom.',
    'https://pump-room.',
    'https://dev.pumproom.',
    'https://ide.code.winbd.ru'
] as const;
export const userStorageKey = 'pumproomUser'
