/**
 * Callbacks module for PumpRoom SDK
 *
 * This module handles callback functions for various PumpRoom events,
 * including initialization and task loading.
 *
 * @module Callbacks
 */
import {getPumpRoomEventMessage} from './messaging.ts';
import type {OnInitCallback, OnTaskLoadedCallback, EnvironmentData} from './types/index.ts';

/** Stores the callback function to be executed on initialization */
let onInitCallback: OnInitCallback | null = null;

/** Stores the callback function to be executed when a task is loaded */
let onTaskLoadedCallback: OnTaskLoadedCallback | null = null;

/**
 * Sets a callback function to be executed on initialization
 *
 * This function allows setting a callback that will be executed immediately
 * after processing the getEnvironment message, with the instanceContext passed to it.
 * The callback can be either synchronous or asynchronous (async function).
 *
 * @param callback - The callback function to execute on initialization (can be async)
 * @example
 * ```typescript
 * // Set a synchronous callback to be executed on initialization
 * setOnInitCallback((instanceContext) => {
 *   console.log('Instance initialized:', instanceContext);
 *   // Perform actions with the instanceContext
 *   console.log('Instance UID:', instanceContext.instanceUid);
 *   console.log('Repository:', instanceContext.repoName);
 *   console.log('Task:', instanceContext.taskName);
 * });
 *
 * // Set an asynchronous callback to be executed on initialization
 * setOnInitCallback(async (instanceContext) => {
 *   console.log('Instance initialized:', instanceContext);
 *   // Perform async actions with the instanceContext
 *   await someAsyncOperation(instanceContext);
 *   console.log('Async operations completed');
 * });
 * ```
 */
export function setOnInitCallback(callback: OnInitCallback): void {
    onInitCallback = callback;
}

/**
 * Sets a callback function to be executed when a task is loaded
 *
 * This function allows setting a callback that will be executed when
 * an onTaskLoaded message is received, with the payload containing instanceContext and task
 * information passed to it. The callback can be either synchronous or
 * asynchronous (async function).
 *
 * @param callback - The callback function to execute when a task is loaded (can be async)
 * @example
 * ```typescript
 * // Set a synchronous callback to be executed when a task is loaded
 * setOnTaskLoadedCallback((payload) => {
 *   console.log('Task loaded:', payload.task);
 *   console.log('Task UID:', payload.task.uid);
 *   console.log('Task Description:', payload.task.description);
 *   console.log('Instance UID:', payload.instanceContext.instanceUid);
 * });
 *
 * // Set an asynchronous callback to be executed when a task is loaded
 * setOnTaskLoadedCallback(async (payload) => {
 *   console.log('Task loaded:', payload.task);
 *   // Perform async actions with the task information
 *   await someAsyncOperation(payload.task);
 *   console.log('Async operations completed');
 * });
 * ```
 */
export function setOnTaskLoadedCallback(callback: OnTaskLoadedCallback): void {
    onTaskLoadedCallback = callback;
}

/**
 * Executes the onInitCallback if it's set
 *
 * @param data - callback data
 * @internal
 */
export function executeOnInitCallback(data: EnvironmentData): void {
    if (onInitCallback) {
        // Call the callback, which may return a Promise
        onInitCallback(data);
        // No need to await the Promise as we're not using the result
    }
}

/**
 * Handles onTaskLoaded messages from PumpRoom iframes
 *
 * @param event - The message event
 * @internal
 */
export function handleTaskLoadedMessage(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event, 'onTaskLoaded');
    if (!data) return;

    // Execute the onTaskLoaded callback if it's set
    if (onTaskLoadedCallback) {
        // Call the callback, which may return a Promise
        const result = onTaskLoadedCallback(data.payload);
        // No need to await the Promise as we're not using the result
    }
}

/**
 * Sets up a listener for task-related messages
 *
 * This function adds an event listener to the window to handle
 * messages related to task loading from PumpRoom iframes.
 */
export function setTaskListener(): void {
    window.addEventListener('message', handleTaskLoadedMessage);
}
