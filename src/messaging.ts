/**
 * Messaging module for PumpRoom SDK
 * 
 * This module provides utilities for handling messages between
 * the SDK and PumpRoom iframes, including validating and sending messages.
 * 
 * @module Messaging
 */
import type {PumpRoomMessage} from './types.ts';
import {getCurrentUser} from './state.ts';

/**
 * Extracts and validates a PumpRoom message from a MessageEvent
 * 
 * This function checks if the event data is a valid PumpRoom message
 * by verifying that it has the correct service identifier and a type.
 * 
 * @param event - The message event to extract data from
 * @returns The PumpRoom message or null if the event doesn't contain a valid message
 */
export function getPumpRoomEventMessage(event: MessageEvent): PumpRoomMessage | null {
    if (event.data?.service !== 'pumproom') return null;
    if (!event.data?.type) return null;
    return event.data;
}

/**
 * Sends the current user information to a target window
 * 
 * This function retrieves the current authenticated user and sends
 * it to the specified target window using the PumpRoom message format.
 * If no user is authenticated, the function does nothing.
 * 
 * @param target - The window to send the user information to
 * @param origin - The origin of the target window
 */
export function sendUser(target: Window, origin: string): void {
    const user = getCurrentUser();
    if (!user) return;
    const message: PumpRoomMessage = {
        service: 'pumproom',
        type: 'setPumpRoomUser',
        payload: user,
    };
    target.postMessage(message, origin);
}
