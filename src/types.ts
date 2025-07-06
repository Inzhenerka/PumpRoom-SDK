// Shared type definitions for PumpRoom SDK

/**
 * Identity provider names used by PumpRoom.
 */
export type IdentityProviderType = 'tilda' | 'telegram';

/**
 * Information about a user returned by authentication endpoint.
 */
export interface PumpRoomUser {
    uid: string;
    token: string;
    is_admin: boolean;
}

/**
 * Message format exchanged with PumpRoom via postMessage.
 */
export interface PumpRoomMessage {
    service: 'pumproom';
    type: string;
    payload?: any;
}


/**
 * Course information within Tilda profile.
 */
export interface CourseInput {
    alias: string;
    name: string;
    created: Date;
}

/**
 * User profile representation expected by PumpRoom authentication API.
 */
export interface TildaProfileInput {
    login: string;
    name: string;
    istutor: boolean;
    lang: string;
    projectid: string;
    courses?: CourseInput[] | null;
    memberlogo?: string | null;
}

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
 * Payload containing realm identifier.
 */
export interface RealmPayload {
    realm: string;
}

export interface AuthenticateOptions {
    lms?: LMSProfileInput | null;
    profile?: TildaProfileInput | null;
}

/**
 * Input data for authentication call.
 */
export interface AuthInput extends RealmPayload {
    lms?: LMSProfileInput | null;
    profile?: TildaProfileInput | null;
    url?: string | null;
    sdk_version: string;
}

/**
 * Result returned by authentication endpoint.
 */
export interface AuthResult {
    uid: string;
    token: string;
    is_admin: boolean;
    provider: IdentityProviderType;
    available_providers: IdentityProviderType[];
}

/**
 * Input data for token verification call.
 */
export interface VerifyTokenInput extends RealmPayload {
    token: string;
    uid: string;
}

/**
 * Result returned by token verification endpoint.
 */
export interface VerifyTokenResult {
    is_valid: boolean;
    is_admin: boolean;
}


export interface PumpRoomConfig {
    apiKey: string;
    realm: string;
    cacheUser?: boolean;
    minHeight?: number;
}

export interface InternalConfig {
    apiKey: string;
    realm: string;
    cacheUser: boolean;
    minHeight?: number;
}

