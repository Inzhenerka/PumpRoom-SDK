import {
    InstanceContext,
    PumpRoomUser,
    TaskStatus,
    EnvironmentData,
    TaskDetails,
    SubmissionResult,
} from "./index.ts";

export type PumpRoomMessageType =
    'getEnvironment'
    | 'setEnvironment'
    | 'toggleFullscreen'
    | 'setPumpRoomUser'
    | 'getPumpRoomUser'
    | 'setPrompt'
    | 'getStatus'
    | 'reportStatus'
    | 'onTaskLoaded'
    | 'onTaskSubmitted'
    | 'onResultReady';

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
    payload: {
        fullscreenState: boolean
    };
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
    payload: EnvironmentData;
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


export interface SetPromptMessage extends PumproomMessage {
    type: 'setPrompt';
    payload: {
        content: string,
    };
}


export interface GetStatusMessage extends PumproomMessage {
    type: 'getStatus';
}

export interface ReportStatusMessage extends PumproomMessage {
    type: 'reportStatus';
    payload: {
        status: TaskStatus,
    };
}

export interface OnTaskLoadedMessage extends PumproomMessage {
    type: 'onTaskLoaded';
    payload: {
        instanceContext: InstanceContext,
        task: TaskDetails,
    };
}

export interface OnTaskSubmittedMessage extends PumproomMessage {
    type: 'onTaskSubmitted';
    payload: {
        instanceContext: InstanceContext,
        task: TaskDetails,
    }
}

export interface OnResultReadyMessage extends PumproomMessage {
    type: 'onResultReady';
    payload: {
        instanceContext: InstanceContext,
        result: SubmissionResult,
    }
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
                        T extends 'setPrompt' ? SetPromptMessage :
                            T extends 'getStatus' ? GetStatusMessage :
                                T extends 'reportStatus' ? ReportStatusMessage :
                                    T extends 'onTaskLoaded' ? OnTaskLoadedMessage :
                                        T extends 'onTaskSubmitted' ? OnTaskSubmittedMessage :
                                            T extends 'onResultReady' ? OnResultReadyMessage :
                                                PumproomMessage;
