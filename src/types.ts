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
export interface PumpRoomMessage {
    /** Service identifier, always 'pumproom' for PumpRoom messages */
    service: 'pumproom';
    /** Message type that determines how the message is handled */
    type: string;
    /** Optional payload containing additional data */
    payload?: any;
}

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
