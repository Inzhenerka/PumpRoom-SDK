/**
 * Messaging module for PumpRoom SDK
 *
 * This module provides utilities for handling messages between
 * the SDK and PumpRoom iframes, including validating and sending messages.
 *
 * @module Messaging
 */
import type {
    PumpRoomMessageType,
    MessageReturnType,
} from './types.ts';

/**
 * Extracts and validates a PumpRoom message from a MessageEvent
 *
 * This function checks if the event data is a valid PumpRoom message
 * by verifying that it has the correct service identifier and a type.
 * It returns a strongly typed message based on the message type.
 *
 * @template T - The type of message to extract, must be one of PumproomMessageType
 * @param event - The message event to extract data from
 * @param target_type - The expected message type
 * @returns The strongly typed PumpRoom message or null if the event doesn't contain a valid message of the expected type
 */
export function getPumpRoomEventMessage<T extends PumpRoomMessageType>(
    event: MessageEvent,
    target_type: T
): MessageReturnType<T> | null {
    // Basic validation of the message
    if (!event.data || typeof event.data !== 'object') return null;
    if (event.data.service !== 'pumproom') return null;
    if (!event.data.type || typeof event.data.type !== 'string') return null;
    // If target_type is specified, only return messages of that type
    if (target_type && event.data.type !== target_type) return null;
    // Return the message with the appropriate type
    return event.data as any;
}
