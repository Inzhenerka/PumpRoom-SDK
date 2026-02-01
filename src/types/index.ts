/**
 * Types module for PumpRoom SDK
 *
 * This module contains all the type definitions used throughout the SDK,
 * including user information, configuration, API interfaces, and state management.
 *
 * @module Types
 * @category Core
 */

export * from './states.ts';

/**
 * Identity provider names used by PumpRoom
 *
 * These are the authentication providers supported by the PumpRoom platform.
 *
 * @public
 * @category Authentication
 */
export type IdentityProviderType = 'tilda' | 'telegram';

/**
 * Status of a task submission
 *
 * @public
 * @category Callbacks
 */
export type SubmissionStatus = 'success' | 'fail' | 'internal_error';

/**
 * Information about an authenticated user
 *
 * This interface represents a user that has been authenticated with the PumpRoom service.
 *
 * @public
 * @category Authentication
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
 * Course information within Tilda profile
 *
 * This interface represents a course that a user is enrolled in
 * when authenticating via Tilda.
 *
 * @public
 * @category Authentication
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
 *
 * @public
 * @category Authentication
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
 *
 * @public
 * @category Authentication
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
 *
 * @public
 * @category Core
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
 *
 * @public
 * @category Authentication
 */
export interface AuthenticateOptions {
    /** LMS profile information, if authenticating via an LMS */
    lms?: LMSProfileInput | null;
    /** Tilda profile information, if authenticating via Tilda */
    profile?: TildaProfileInput | null;
}

/**
 * Context information for SDK operations
 *
 * This interface contains context information about the execution environment
 * where the SDK is operating, including LMS kit/lesson identifiers.
 *
 * @public
 * @category Environment
 */
export interface LMSContext {
    /** Optional LMS Kit identifier used for tracking the current course context */
    kitId?: string | null;
    /** Optional LMS program (course) identifier used for tracking the current course context */
    programId?: string | null;
    /** Optional lesson identifier used for tracking the current lesson context */
    lessonId?: string | null;
}
/**
 * Context information for API calls
 *
 * This interface contains context information about the execution environment
 * where the SDK is operating, including LMS kit/lesson identifiers.
 *
 * @public
 * @category States
 * @experimental
 */
export interface LMSContextAPI {
    /** Optional LMS Kit identifier used for tracking the current course context */
    kit_id?: string | null;
    /** Optional LMS program (course) identifier used for tracking the current course context */
    program_id?: string | null;
    /** Optional lesson identifier used for tracking the current lesson context */
    lesson_id?: string | null;
}

/**
 * Input data for authentication call
 *
 * This interface defines the data sent to the authentication endpoint.
 *
 * @private
 * @category Authentication
 */
export interface AuthInput extends RealmPayload {
    /** LMS profile information, if authenticating via an LMS */
    lms?: LMSProfileInput | null;
    /** Tilda profile information, if authenticating via Tilda */
    profile?: TildaProfileInput | null;
    /** LMS context information */
    context?: LMSContextAPI;
    /** Current page URL */
    url?: string | null;
    /** SDK version */
    sdk_version: string;
}

/**
 * Result returned by authentication endpoint
 *
 * This interface defines the data returned by the authentication endpoint
 * when authentication is successful.
 *
 * @public
 * @category Authentication
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
 *
 * @public
 * @category Authentication
 */
export interface VerifyTokenInput extends RealmPayload {
    /** Authentication token to verify */
    token: string;
    /** User ID associated with the token */
    uid: string;
    /** LMS context information */
    context?: LMSContextAPI;
}

/**
 * Result returned by token verification endpoint
 *
 * This interface defines the data returned by the token verification endpoint.
 *
 * @public
 * @category Authentication
 */
export interface VerifyTokenResult {
    /** Flag indicating whether the token is valid */
    is_valid: boolean;
    /** Flag indicating whether the user has admin privileges */
    is_admin: boolean;
}

/**
 * Input data for fetching states
 *
 * @public
 * @category States
 * @experimental
 */
export interface FetchStatesInput {
    /** Authenticated user */
    user: PumpRoomUser;
    /** Names of states to fetch */
    state_names: string[];
    /** LMS context information */
    context?: LMSContextAPI;
    /** Current page URL */
    url?: string | null;
    /** SDK version */
    sdk_version: string;
}

/**
 * Input data for storing states
 *
 * @public
 * @category States
 * @experimental
 */
export interface StoreStatesInput {
    /** Authenticated user */
    user: PumpRoomUser;
    /** States to store */
    states: import('./states.ts').State[];
    /** LMS context information */
    context?: LMSContextAPI;
    /** Current page URL */
    url?: string | null;
    /** SDK version */
    sdk_version: string;
}

/**
 * Task data returned for course-related tasks
 *
 * @public
 * @category Courses
 * @experimental
 */
export interface TaskDataOutput {
    /** Unique identifier of the task */
    uid: string;
    /** Display name of the task */
    task_name: string;
    /** Repository name used by the task */
    repo_name: string;
    /** Realm identifier for the task */
    realm: string;
}

/**
 * Course data returned by the course loading endpoint
 *
 * @public
 * @category Courses
 * @experimental
 */
export interface CourseDataOutput {
    /** Unique identifier of the course */
    uid: string;
    /** Display name of the course */
    visible_name: string;
    /** Course URL */
    url: string;
    /** Flag indicating whether the course is paid */
    is_paid: boolean;
    /** Optional student chat URL */
    student_chat_url: string | null;
    /** Optional helper task */
    helper_task: TaskDataOutput | null;
    /** Optional vote task */
    vote_task: TaskDataOutput | null;
}

/**
 * Input data for loading course data
 *
 * @public
 * @category Courses
 * @experimental
 */
export interface LoadCourseDataInput extends RealmPayload {
    /** Current page URL */
    url: string;
    /** LMS context information */
    context: LMSContextAPI;
    /** SDK version */
    sdk_version: string;
}

/**
 * Result returned by the course loading endpoint
 *
 * @public
 * @category Courses
 * @experimental
 */
export interface LoadCourseDataOutput {
    /** Loaded course data or null if not found */
    course: CourseDataOutput | null;
}

/**
 * Callback function type for receiving course data
 *
 * @public
 * @category Courses
 * @experimental
 */
export type CourseDataCallback = (data: LoadCourseDataOutput) => void;

/**
 * Configuration for initializing the SDK
 *
 * This interface defines the configuration options that can be passed
 * to the init function to configure the SDK.
 *
 * @public
 * @category Initialization
 */
export interface PumpRoomConfig {
    /** API key for authenticating with the PumpRoom API */
    apiKey: string;
    /** Realm identifier that determines the context of operations */
    realm: string;
    /**
     * Optional LMS type identifier applied globally for the SDK.
     * When set to 'getcourse', the SDK will validate LMS identifiers
     * to ensure that GetCourse template placeholders were replaced.
     */
    type?: 'getcourse';
    /**
     * Flag indicating whether to cache the user in localStorage
     * @defaultValue true
     */
    cacheUser?: boolean;
    /**
     * Minimum height for PumpRoom iframes in pixels
     * @defaultValue 600
     */
    minHeight?: number;
    /**
     * Optional LMS context applied globally for the SDK.
     * Contains identifiers like kit_id, program_id, and lesson_id that will be
     * sent to the API with relevant requests.
     */
    context?: LMSContext;
}

/**
 * Internal configuration used by the SDK
 *
 * This interface extends PumpRoomConfig with default values applied.
 * It is used internally by the SDK.
 *
 * @internal
 * @category Configuration
 */
export interface InternalConfig {
    /** API key for authenticating with the PumpRoom API */
    apiKey: string;
    /** Realm identifier that determines the context of operations */
    realm: string;
    /** Optional LMS type identifier applied globally for the SDK. */
    type?: 'getcourse';
    /** Flag indicating whether to cache the user in localStorage */
    cacheUser: boolean;
    /** Minimum height for PumpRoom iframes in pixels */
    minHeight?: number;
    /**
     * Optional LMS context applied globally for the SDK.
     * Contains identifiers like kit_id, program_id, and lesson_id that will be
     * sent to the API with relevant requests.
     */
    context?: LMSContext;
}

/**
 * Context information for a PumpRoom instance
 *
 * This interface represents the context of a PumpRoom instance,
 * containing identification and metadata used for instance registration and management.
 *
 * @public
 * @category Callbacks
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

/**
 * Callback function type for on initialization
 *
 * @public
 * @category Callbacks
 */
export type OnInitCallback = (data: EnvironmentData) => void | Promise<void>;

/**
 * Callback function type for when a task is loaded
 *
 * @public
 * @category Callbacks
 */
export type OnTaskLoadedCallback = (data: LoadedTaskData) => void | Promise<void>;

/**
 * Callback function type for when a task is submitted
 *
 * @public
 * @category Callbacks
 */
export type OnTaskSubmittedCallback = (data: LoadedTaskData) => void | Promise<void>;

/**
 * Callback function type for when a result is ready
 *
 * @public
 * @category Callbacks
 */
export type OnResultReadyCallback = (data: ResultData) => void | Promise<void>;

/**
 * Payload for fullscreen toggle messages
 *
 * This interface defines the payload structure for messages
 * that toggle the fullscreen state of PumpRoom iframes.
 *
 * @public
 * @category UI
 */
export interface FullscreenParameters {
    /** Flag indicating whether fullscreen mode is active */
    fullscreenState: boolean;
}

/**
 * Status of a task loading process
 *
 * @public
 * @category Callbacks
 */
export type TaskStatus = 'loading' | 'ready' | 'error';

/**
 * Detailed information about a task
 *
 * @public
 * @category Callbacks
 */
export interface TaskDetails {
    /** Unique identifier of the task */
    uid: string;
    /** Optional description of the task */
    description: string | null;
}

/**
 * Result of a task submission
 *
 * @public
 * @category Callbacks
 */
export interface SubmissionResult {
    /** Unique identifier of the task */
    taskUid: string;
    /** Unique identifier of the submission */
    submissionUid: string;
    /** Status of the submission */
    status: SubmissionStatus;
    /** Optional message about the submission */
    message: string | null;
    /** Optional standard output from the submission */
    stdout: string | null;
}

/**
 * Data provided to callbacks after the SDK receives environment information
 *
 * @public
 * @category Callbacks
 */
export interface EnvironmentData {
    /** Context information about the current instance */
    instanceContext: InstanceContext;
}

/**
 * Data provided to callbacks when a task is loaded
 *
 * @public
 * @category Callbacks
 */
export interface LoadedTaskData {
    /** Context information about the current instance */
    instanceContext: InstanceContext;
    /** Details about the loaded task */
    task: TaskDetails;
}

/**
 * Data provided to callbacks when a result is ready
 *
 * @public
 * @category Callbacks
 */
export interface ResultData {
    /** Context information about the current instance */
    instanceContext: InstanceContext;
    /** Result of the submission */
    result: SubmissionResult;
}
