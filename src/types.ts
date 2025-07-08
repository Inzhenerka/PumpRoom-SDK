/**
 * Types module for PumpRoom SDK
 *
 * This module contains all the type definitions used throughout the SDK,
 * including user information, configuration, and API interfaces.
 *
 * @module Types
 * @category Interfaces
 */

/**
 * Identity provider names used by PumpRoom
 *
 * These are the authentication providers supported by the PumpRoom platform.
 */
export type IdentityProviderType = 'tilda' | 'telegram';

/**
 * Message types used in PumpRoom communication
 * 
 * This type defines all possible message types that can be exchanged
 * between the SDK and PumpRoom iframes.
 */
export type PumpRoomMessageType =
    'getEnvironment'
    | 'setEnvironment'
    | 'toggleFullscreen'
    | 'setPumpRoomUser'
    | 'getPumpRoomUser';

/**
 * Information about an authenticated user
 *
 * This interface represents a user that has been authenticated with the PumpRoom service.
 */
export interface PumpRoomUser {
    /** Unique identifier of the user */
    uid: string;
    /** Authentication token for the user */
    token: string;
    /** Flag indicating whether the user has admin privileges */
    is_admin: boolean;
}

/**
 * Message format exchanged with PumpRoom via postMessage
 *
 * This interface defines the structure of messages sent between
 * the SDK and PumpRoom iframes using the window.postMessage API.
 */
/**
 * Base interface for all PumpRoom messages
 *
 * This interface defines the common structure of all messages exchanged with PumpRoom.
 * Specific message types extend this interface with their own payload types.
 */
export interface PumproomMessage<T = any> {
    /** Service identifier, always 'pumproom' for PumpRoom messages */
    service: 'pumproom';
    /** Message type that determines how the message is handled */
    type: PumpRoomMessageType;
    /** Payload containing additional data specific to the message type */
    payload?: T;
}

/**
 * Message for toggling fullscreen mode
 */
export interface ToggleFullscreenMessage extends PumproomMessage {
    /** Message type is always 'toggleFullscreen' for fullscreen toggle messages */
    type: 'toggleFullscreen';
    payload: FullscreenMessagePayload;
}

/**
 * Message for setting environment variables
 */
export interface SetEnvironmentMessage extends PumproomMessage {
    /** Message type is always 'setEnvironment' for environment setting messages */
    type: 'setEnvironment';
}

/**
 * Message for getting environment variables
 */
export interface GetEnvironmentMessage extends PumproomMessage {
    /** Message type is always 'getEnvironment' for environment getting messages */
    type: 'getEnvironment';
    payload: InstanceContext;
}

/**
 * Message for setting the PumpRoom user
 */
export interface SetPumpRoomUserMessage extends PumproomMessage {
    /** Message type is always 'setPumpRoomUser' for user setting messages */
    type: 'setPumpRoomUser';
    payload: PumpRoomUser;
}

/**
 * Message for getting the PumpRoom user
 */
export interface GetPumpRoomUserMessage extends PumproomMessage {
    /** Message type is always 'getPumpRoomUser' for user getting messages */
    type: 'getPumpRoomUser';
}


/**
 * Type mapping from message type to corresponding message interface
 * 
 * This type uses conditional types to map from a PumpRoomMessageType
 * to the corresponding message interface, allowing for strongly typed
 * message handling based on the message type.
 * 
 * @template T - The message type to map
 */
export type MessageReturnType<T extends PumpRoomMessageType> =
    T extends 'toggleFullscreen' ? ToggleFullscreenMessage :
        T extends 'setEnvironment' ? SetEnvironmentMessage :
            T extends 'getEnvironment' ? GetEnvironmentMessage :
                T extends 'setPumpRoomUser' ? SetPumpRoomUserMessage :
                    T extends 'getPumpRoomUser' ? GetPumpRoomUserMessage :
                            PumproomMessage;

/**
 * Course information within Tilda profile
 *
 * This interface represents a course that a user is enrolled in
 * when authenticating via Tilda.
 */
export interface CourseInput {
    /** Unique identifier of the course */
    alias: string;
    /** Display name of the course */
    name: string;
    /** Date when the course was created or when the user enrolled */
    created: Date;
}

/**
 * User profile representation expected by PumpRoom authentication API
 *
 * This interface represents a user profile from Tilda that is used
 * for authentication with the PumpRoom service.
 */
export interface TildaProfileInput {
    /** User's login identifier in Tilda */
    login: string;
    /** User's display name */
    name: string;
    /** Flag indicating whether the user is a tutor */
    istutor: boolean;
    /** User's preferred language */
    lang: string;
    /** Tilda project identifier */
    projectid: string;
    /** Optional list of courses the user is enrolled in */
    courses?: CourseInput[] | null;
    /** Optional URL to the user's profile picture */
    memberlogo?: string | null;
}

/**
 * User profile from a Learning Management System (LMS)
 *
 * This interface represents a user profile from an LMS that is used
 * for authentication with the PumpRoom service.
 */
export interface LMSProfileInput {
    /**
     * Unique identifier of the user within LMS.
     * Can be any string. When not provided and a valid email is passed via
     * `email`, it will be used as the identifier.
     */
    id?: string;

    /**
     * Optional email that can also act as identifier if `id` is missing.
     */
    email?: string;

    /** Display name of the user */
    name: string;

    /** Optional link to avatar */
    photo_url?: string | null;
}

/**
 * Payload containing realm identifier
 *
 * This interface is used as a base for requests that require a realm identifier.
 */
export interface RealmPayload {
    /** Realm identifier that determines the context of the operation */
    realm: string;
}

/**
 * Options for the authenticate function
 *
 * This interface defines the options that can be passed to the authenticate function
 * to specify the user profile information.
 */
export interface AuthenticateOptions {
    /** LMS profile information, if authenticating via an LMS */
    lms?: LMSProfileInput | null;
    /** Tilda profile information, if authenticating via Tilda */
    profile?: TildaProfileInput | null;
}

/**
 * Input data for authentication call
 *
 * This interface defines the data sent to the authentication endpoint.
 */
export interface AuthInput extends RealmPayload {
    /** LMS profile information, if authenticating via an LMS */
    lms?: LMSProfileInput | null;
    /** Tilda profile information, if authenticating via Tilda */
    profile?: TildaProfileInput | null;
    /** URL of the page where authentication is being performed */
    url?: string | null;
    /** Version of the SDK performing the authentication */
    sdk_version: string;
}

/**
 * Result returned by authentication endpoint
 *
 * This interface defines the data returned by the authentication endpoint
 * when authentication is successful.
 */
export interface AuthResult {
    /** Unique identifier of the authenticated user */
    uid: string;
    /** Authentication token for the user */
    token: string;
    /** Flag indicating whether the user has admin privileges */
    is_admin: boolean;
    /** Identity provider used for authentication */
    provider: IdentityProviderType;
    /** List of identity providers available for this user */
    available_providers: IdentityProviderType[];
}

/**
 * Input data for token verification call
 *
 * This interface defines the data sent to the token verification endpoint.
 */
export interface VerifyTokenInput extends RealmPayload {
    /** Authentication token to verify */
    token: string;
    /** User ID associated with the token */
    uid: string;
}

/**
 * Result returned by token verification endpoint
 *
 * This interface defines the data returned by the token verification endpoint.
 */
export interface VerifyTokenResult {
    /** Flag indicating whether the token is valid */
    is_valid: boolean;
    /** Flag indicating whether the user has admin privileges */
    is_admin: boolean;
}

/**
 * Configuration for initializing the SDK
 *
 * This interface defines the configuration options that can be passed
 * to the init function to configure the SDK.
 */
export interface PumpRoomConfig {
    /** API key for authenticating with the PumpRoom API */
    apiKey: string;
    /** Realm identifier that determines the context of operations */
    realm: string;
    /** Flag indicating whether to cache the user in localStorage (default: true) */
    cacheUser?: boolean;
    /** Minimum height for PumpRoom iframes in pixels */
    minHeight?: number;
}

/**
 * Internal configuration used by the SDK
 *
 * This interface extends PumpRoomConfig with default values applied.
 * It is used internally by the SDK.
 *
 * @internal
 */
export interface InternalConfig {
    /** API key for authenticating with the PumpRoom API */
    apiKey: string;
    /** Realm identifier that determines the context of operations */
    realm: string;
    /** Flag indicating whether to cache the user in localStorage */
    cacheUser: boolean;
    /** Minimum height for PumpRoom iframes in pixels */
    minHeight?: number;
}

/**
 * Context information for a PumpRoom instance
 *
 * This interface represents the context of a PumpRoom instance,
 * containing identification and metadata used for instance registration and management.
 */
export interface InstanceContext {
    /** Unique identifier for the instance */
    instanceUid: string;
    /** Name of the repository associated with the instance */
    repoName: string;
    /** Name of the task associated with the instance */
    taskName: string;
    /** Realm identifier that determines the context of operations */
    realm: string;
    /** Optional tags associated with the instance */
    tags: string | undefined;
}

/** Callback function type for on initialization */
export type OnInitCallback = (instanceContext: InstanceContext) => void | Promise<void>;


/**
 * Payload for fullscreen toggle messages
 * 
 * This interface defines the payload structure for messages
 * that toggle the fullscreen state of PumpRoom iframes.
 */
export interface FullscreenMessagePayload {
    /** Flag indicating whether fullscreen mode is active */
    fullscreenState: boolean;
}
