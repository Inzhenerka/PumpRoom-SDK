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

/**
 * Payload containing realm identifier.
 */
export interface RealmPayload {
    realm: string;
}

/**
 * Input data for authentication call.
 */
export interface AuthInput extends RealmPayload {
    profile?: TildaProfileInput | null;
    url?: string | null;
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

