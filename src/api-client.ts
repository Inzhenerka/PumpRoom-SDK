import {
    AuthInput,
    VerifyTokenInput,
    VerifyTokenResult,
    PumpRoomUser,
    AuthenticateOptions,
    State,
    GetStatesResponse,
    SetStatesResponse,
} from './types/index.ts';
import {AUTH_URL, VERIFY_URL, GET_STATES_URL, SET_STATES_URL} from './constants.ts';
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

        const resp = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': this.apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            throw new Error(`User verification error: ${resp.status} ${resp.statusText}`);
        }

        return await resp.json() as VerifyTokenResult;
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
    async authenticate(options: AuthenticateOptions, realm: string): Promise<PumpRoomUser> {
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
            throw new Error(`Authentication error: ${response.status} ${response.statusText}`);
        }
    }

    /**
     * Fetches states from the backend
     *
     * This method retrieves the values of the specified states from the backend.
     *
     * @param stateNames - Array of state names to fetch
     * @param user - The authenticated user
     * @returns Promise resolving to the fetched states
     * @throws Error if the request fails
     *
     * @experimental
     * @example
     * ```typescript
     * try {
     *   const states = await client.fetchStates(['userPreferences', 'lastVisitedPage'], user);
     *   console.log(states);
     * } catch (error) {
     *   console.error(error);
     * }
     * ```
     */
    async fetchStates(stateNames: string[], user: PumpRoomUser): Promise<GetStatesResponse> {
        const response = await fetch(GET_STATES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': this.apiKey,
            },
            body: JSON.stringify({
                user: user,
                url: typeof window !== 'undefined' ? window.location.href : null,
                state_names: stateNames,
                sdk_version: getVersion()
            })
        });

        if (!response.ok) {
            throw new Error(`Request error: ${response.status} ${response.statusText}`);
        }

        return await response.json() as GetStatesResponse;
    }

    /**
     * Stores states to the backend
     *
     * This method saves the provided states to the backend.
     *
     * @param states - Array of state objects to store
     * @param user - The authenticated user
     * @returns Promise resolving to the result of the operation
     * @throws Error if the request fails
     *
     * @experimental
     * @example
     * ```typescript
     * try {
     *   const result = await client.storeStates([
     *     { name: 'userPreferences', value: 'dark' },
     *     { name: 'lastVisitedPage', value: '/dashboard' }
     *   ], user);
     *   console.log(result);
     * } catch (error) {
     *   console.error(error);
     * }
     * ```
     */
    async storeStates(states: State[], user: PumpRoomUser): Promise<SetStatesResponse> {
        const response = await fetch(SET_STATES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': this.apiKey,
            },
            body: JSON.stringify({
                user: user,
                url: typeof window !== 'undefined' ? window.location.href : null,
                states: states,
                sdk_version: getVersion()
            })
        });

        if (!response.ok) {
            throw new Error(`Request error: ${response.status} ${response.statusText}`);
        }

        return await response.json() as SetStatesResponse;
    }
}

import {setApiClientInstance, getApiClientInstance} from './globals.ts';

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
    setApiClientInstance(new ApiClient(apiKey));
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
    return getApiClientInstance();
}
