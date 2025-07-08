import {
    AuthInput,
    VerifyTokenInput,
    VerifyTokenResult,
    PumpRoomUser,
    AuthenticateOptions,
} from './types/index.ts';
import {AUTH_URL, VERIFY_URL} from './constants.ts';
import {getVersion} from './version.ts';

/**
 * API client for PumpRoom SDK
 * Contains all methods for working with the PumpRoom API
 */
export class ApiClient {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Verify a cached user token
     * @param user User to verify
     * @param realm Realm identifier
     * @returns True if the token is valid, false otherwise
     */
    async verifyToken(user: PumpRoomUser, realm: string): Promise<VerifyTokenResult> {
        const payload: VerifyTokenInput = {
            realm,
            token: user.token,
            uid: user.uid,
        };

        try {
            const resp = await fetch(VERIFY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': this.apiKey,
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                return {is_valid: false, is_admin: false};
            }

            return await resp.json() as VerifyTokenResult;
        } catch (err) {
            console.error('Verification error', err);
            return {is_valid: false, is_admin: false};
        }
    }

    /**
     * Authenticate a user
     * @param options Authentication options
     * @param realm Realm identifier
     * @returns Authenticated user or null if authentication failed
     */
    async authenticate(options: AuthenticateOptions, realm: string): Promise<PumpRoomUser | null> {
        try {
            const body: AuthInput = {
                lms: options.lms,
                profile: options.profile,
                realm: realm,
                url: typeof window !== 'undefined' ? window.location.href : null,
                sdk_version: getVersion(),
            };

            const response = await fetch(AUTH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': this.apiKey,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                return await response.json() as PumpRoomUser;
            } else {
                console.error('Authentication failed', response.status);
                return null;
            }
        } catch (err) {
            console.error('Network error', err);
            return null;
        }
    }
}

// Create a singleton instance
let apiClientInstance: ApiClient | null = null;

/**
 * Initialize the API client with the API key
 * @param apiKey API key
 */
export function initApiClient(apiKey: string): void {
    apiClientInstance = new ApiClient(apiKey);
}

/**
 * Get the API client instance
 * @returns API client instance
 * @throws Error if the API client is not initialized
 */
export function getApiClient(): ApiClient {
    if (!apiClientInstance) {
        throw new Error('API client is not initialized. Call initApiClient first.');
    }
    return apiClientInstance;
}