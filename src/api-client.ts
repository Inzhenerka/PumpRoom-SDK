import {
  AUTH_URL,
  GET_STATES_URL,
  LOAD_COURSE_URL,
  SET_STATES_URL,
  VERIFY_URL,
  resolveApiBaseUrls,
} from "./constants.ts";
import { getApiClientInstance, getConfig, setApiClientInstance } from "./globals.ts";
import type { FetchStatesInput, StoreStatesInput } from "./types/index.ts";
import {
  AuthenticateOptions,
  AuthInput,
  LMSContextAPI,
  LoadCourseDataInput,
  LoadCourseDataOutput,
  PumpRoomUser,
  State,
  StatesResponse,
  VerifyTokenInput,
  VerifyTokenResult,
} from "./types/index.ts";
import { getCurrentNormalizedUrl } from "./utils.js";
import { getVersion } from "./version.ts";

type RequestContext = LMSContextAPI & {
  url?: string | null;
  sdk_version?: string;
};

/**
 * API client for PumpRoom SDK.
 *
 * This class wraps the HTTP calls performed by the SDK and is normally
 * initialized automatically when calling {@link init}. It can also be used
 * directly within the SDK codebase when custom API calls are required.
 *
 * @example
 * ```typescript
 * import { ApiClient } from './api-client';
 *
 * const client = new ApiClient('api-key');
 * const user = await client.authenticate({ identity: { provider: 'lms', id: '42' } }, 'realm');
 * console.log(user.uid);
 * ```
 */
export class ApiClient {
  private readonly apiKey: string;
  private readonly apiBaseUrls: string[];
  private activeAddress = 0;

  constructor(apiKey: string, apiBaseUrl?: string, fallbackApiBaseUrls?: readonly string[]) {
    this.apiKey = apiKey;
    this.apiBaseUrls = resolveApiBaseUrls(apiBaseUrl, fallbackApiBaseUrls);
  }

  /** Routing can be reused only for the same key and ordered, normalized addresses. */
  hasSameConfiguration(other: ApiClient): boolean {
    return (
      this.apiKey === other.apiKey &&
      this.apiBaseUrls.length === other.apiBaseUrls.length &&
      this.apiBaseUrls.every((url, index) => url === other.apiBaseUrls[index])
    );
  }

  /** Retry only operations known to be safe to repeat, even though this API uses POST for reads. */
  private async request<T>(
    url: string,
    payload: unknown,
    errorPrefix: string,
    retryable: boolean,
    signal?: AbortSignal,
  ): Promise<T> {
    const assertNotAborted = () => {
      if (signal?.aborted) throw signal.reason ?? new DOMException("Request aborted", "AbortError");
    };
    const body = JSON.stringify(payload);
    let address = this.activeAddress;
    for (let attempt = 0; attempt < this.apiBaseUrls.length; attempt++) {
      assertNotAborted();
      const controller =
        retryable && url !== AUTH_URL && this.apiBaseUrls.length > 1
          ? new AbortController()
          : undefined;
      let timedOut = false;
      const onAbort = () => controller?.abort(signal?.reason);
      signal?.addEventListener("abort", onAbort, { once: true });
      // Bound retryable attempts; authentication and writes retain their existing timeout behavior.
      const timeout = controller
        ? setTimeout(() => {
            timedOut = true;
            controller.abort(new DOMException("API request timed out", "TimeoutError"));
          }, 10000)
        : undefined;
      let response: Response | undefined;
      let failure: unknown;
      try {
        response = await fetch(`${this.apiBaseUrls[address]}${new URL(url).pathname}`, {
          ...((controller?.signal ?? signal) ? { signal: controller?.signal ?? signal } : {}),
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-KEY": this.apiKey },
          body,
        });
        assertNotAborted();
        if (controller?.signal.aborted) throw controller.signal.reason;
        if (response.ok) {
          const result = (await response.json()) as T;
          assertNotAborted();
          if (controller?.signal.aborted) throw controller.signal.reason;
          return result;
        }
      } catch (error) {
        // Cancellation and invalid responses are not evidence that another address should be tried.
        assertNotAborted();
        if (!timedOut && !(error instanceof TypeError)) throw error;
        failure = timedOut ? controller!.signal.reason : error;
      } finally {
        if (timeout !== undefined) clearTimeout(timeout);
        signal?.removeEventListener("abort", onAbort);
      }
      if (response && !response.ok) {
        failure = new Error(`${errorPrefix}: ${response.status} ${response.statusText}`);
        if (response.status !== 502 && response.status !== 503 && response.status !== 504) {
          throw failure;
        }
        void response.body?.cancel().catch(() => {});
      }
      // A late failure from an older concurrent request must not skip the currently selected address.
      const next = (address + 1) % this.apiBaseUrls.length;
      if (this.activeAddress === address) this.activeAddress = next;
      if (!retryable || attempt === this.apiBaseUrls.length - 1) throw failure;
      address = next;
    }
    throw new Error("No API address available");
  }

  /**
   * Builds LMS context payload that is sent with most API requests.
   */
  private buildContext(includeEnvironment = false): RequestContext {
    const config = getConfig();
    const context: RequestContext = {
      kit_id: config?.context?.kitId,
      program_id: config?.context?.programId,
      lesson_id: config?.context?.lessonId,
    };
    if (includeEnvironment) {
      context.url = getCurrentNormalizedUrl();
      context.sdk_version = getVersion();
    }
    return context;
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
  async verifyToken(
    user: PumpRoomUser,
    realm: string,
    signal?: AbortSignal,
  ): Promise<VerifyTokenResult> {
    const payload: VerifyTokenInput = {
      realm,
      token: user.token,
      uid: user.uid,
      context: this.buildContext(),
    };

    return this.request<VerifyTokenResult>(
      VERIFY_URL,
      payload,
      "User verification error",
      true,
      signal,
    );
  }

  /**
   * Authenticate a user.
   *
   * Performs a call to the PumpRoom authentication endpoint using the
   * provided identity information.
   *
   * @param options - Authentication options
   * @param realm - Realm identifier
   * @returns Authenticated user
   * @throws Error if the authentication request fails
   *
   * @example
   * ```typescript
   * const user = await client.authenticate({ identity: { provider: 'lms', id: '42' } }, 'academy');
   * console.log('Authenticated as', user.uid);
   * ```
   */
  async authenticate(options: AuthenticateOptions, realm: string): Promise<PumpRoomUser> {
    const body: AuthInput = {
      identity: options.identity,
      realm: realm,
      url: getCurrentNormalizedUrl(),
      sdk_version: getVersion(),
      context: this.buildContext(),
    };

    return this.request<PumpRoomUser>(AUTH_URL, body, "Authentication error", true, options.signal);
  }

  /**
   * Loads course data for the current URL.
   *
   * This method retrieves course details and related tasks using the current page URL
   * and LMS context.
   *
   * @param realm - Realm identifier
   * @returns Promise resolving to course data output
   * @throws Error if the request fails or the current URL is unavailable
   *
   * @category Courses
   * @experimental
   * @example
   * ```typescript
   * const result = await client.loadCourseData('academy');
   * console.log(result.course?.visible_name);
   * ```
   */
  async loadCourseData(realm: string): Promise<LoadCourseDataOutput> {
    const url = getCurrentNormalizedUrl();
    if (!url) {
      throw new Error("Current URL is not available");
    }
    const body: LoadCourseDataInput = {
      realm,
      url,
      context: this.buildContext(),
      sdk_version: getVersion(),
    };

    return this.request<LoadCourseDataOutput>(LOAD_COURSE_URL, body, "Request error", true);
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
  async fetchStates(
    stateNames: string[],
    user: PumpRoomUser,
    options?: { includeEnvInContext?: boolean },
  ): Promise<StatesResponse> {
    const context = this.buildContext(options?.includeEnvInContext);
    const body: FetchStatesInput = {
      user: user,
      state_names: stateNames,
      url: getCurrentNormalizedUrl(),
      sdk_version: getVersion(),
      context,
    };
    return this.request<StatesResponse>(GET_STATES_URL, body, "Request error", true);
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
  async storeStates(
    states: State[],
    user: PumpRoomUser,
    options?: { includeEnvInContext?: boolean },
  ): Promise<StatesResponse> {
    const context = this.buildContext(options?.includeEnvInContext);
    const body: StoreStatesInput = {
      user: user,
      states: states,
      url: getCurrentNormalizedUrl(),
      sdk_version: getVersion(),
      context,
    };
    return this.request<StatesResponse>(SET_STATES_URL, body, "Request error", false);
  }
}

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
export function initApiClient(
  apiKey: string,
  apiBaseUrl?: string,
  fallbackApiBaseUrls?: readonly string[],
): void {
  const client = new ApiClient(apiKey, apiBaseUrl, fallbackApiBaseUrls);
  const current = getApiClientInstance();
  if (!current?.hasSameConfiguration(client)) setApiClientInstance(client);
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
  const client = getApiClientInstance();
  if (!client) throw new Error("API client is not initialized. Call initApiClient first.");
  return client;
}
