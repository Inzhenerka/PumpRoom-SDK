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
 * API client for PumpRoom SDK.
 *
 * This class wraps the HTTP calls performed by the SDK and is normally
 * initialized automatically when calling {@link init}. It can also be used
 * directly when custom API calls are required.
 *
 * @example
 * ```typescript
 * import { ApiClient } from 'pumproom-sdk';
 *
 * const client = new ApiClient('api-key');
 * const user = await client.authenticate({ lms: { id: '42', name: 'Alice' } }, 'realm');
 * console.log(user?.uid);
 * ```
 */
export class ApiClient {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Verify a cached user token.
     *
     * This call checks whether the provided user token is still valid for the
     * specified realm.
     *
     * @param user - User to verify
     * @param realm - Realm identifier
     * @returns Result with validity and admin flag
     *
     * @example
     * ```typescript
     * const result = await client.verifyToken(user, 'academy');
     * if (result.is_valid) {
     *   console.log('Token is still valid');
     * }
     * ```
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
     * Authenticate a user.
     *
     * Performs a call to the PumpRoom authentication endpoint using the
     * provided profile information.
     *
     * @param options - Authentication options
     * @param realm - Realm identifier
     * @returns Authenticated user or `null` if authentication failed
     *
     * @example
     * ```typescript
     * const user = await client.authenticate({ profile: { login: 'bob', name: 'Bob', istutor: false, lang: 'en', projectid: '1' } }, 'academy');
     * if (user) {
     *   console.log('Authenticated as', user.uid);
     * }
     * ```
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
 * Initialize the API client with the API key.
 *
 * This function is automatically called from {@link init} but can also be used
 * to prepare a client instance manually.
 *
 * @param apiKey - API key issued for your PumpRoom integration
 *
 * @example
 * ```typescript
 * initApiClient('my-key');
 * const client = getApiClient();
 * ```
 */
export function initApiClient(apiKey: string): void {
    apiClientInstance = new ApiClient(apiKey);
}

/**
 * Get the API client instance.
 *
 * @returns API client instance
 * @throws Error if the API client is not initialized via {@link initApiClient}
 *
 * @example
 * ```typescript
 * const client = getApiClient();
 * const tokenInfo = await client.verifyToken(user, 'academy');
 * ```
 */
export function getApiClient(): ApiClient {
    if (!apiClientInstance) {
        throw new Error('API client is not initialized. Call initApiClient first.');
    }
    return apiClientInstance;}