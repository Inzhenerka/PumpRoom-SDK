/**
 * Callbacks module for PumpRoom SDK
 *
 * This module handles callback functions for various PumpRoom events,
 * including initialization and task loading.
 *
 * @module Callbacks
 */
import {getPumpRoomEventMessage} from './messaging.ts';
import {
    setOnInitCallback as setOnInitCallbackGlobal,
    getOnInitCallback,
    setOnTaskLoadedCallback as setOnTaskLoadedCallbackGlobal,
    getOnTaskLoadedCallback,
    setOnTaskSubmittedCallback as setOnTaskSubmittedCallbackGlobal,
    getOnTaskSubmittedCallback,
    setOnResultReadyCallback as setOnResultReadyCallbackGlobal,
    getOnResultReadyCallback
} from './globals.ts';
import type {
    OnInitCallback, 
    OnTaskLoadedCallback, 
    OnTaskSubmittedCallback,
    OnResultReadyCallback,
    EnvironmentData
} from './types/index.ts';

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
    setOnInitCallbackGlobal(callback);
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
    setOnTaskLoadedCallbackGlobal(callback);
}

/**
 * Sets a callback function to be executed when a task is submitted
 *
 * This function allows setting a callback that will be executed when
 * an onTaskSubmitted message is received, with the payload containing instanceContext and task
 * information passed to it. The callback can be either synchronous or
 * asynchronous (async function).
 *
 * @param callback - The callback function to execute when a task is submitted (can be async)
 * @example
 * ```typescript
 * // Set a synchronous callback to be executed when a task is submitted
 * setOnTaskSubmittedCallback((payload) => {
 *   console.log('Task submitted:', payload.task);
 *   console.log('Task UID:', payload.task.uid);
 *   console.log('Task Description:', payload.task.description);
 *   console.log('Instance UID:', payload.instanceContext.instanceUid);
 * });
 *
 * // Set an asynchronous callback to be executed when a task is submitted
 * setOnTaskSubmittedCallback(async (payload) => {
 *   console.log('Task submitted:', payload.task);
 *   // Perform async actions with the task information
 *   await someAsyncOperation(payload.task);
 *   console.log('Async operations completed');
 * });
 * ```
 */
export function setOnTaskSubmittedCallback(callback: OnTaskSubmittedCallback): void {
    setOnTaskSubmittedCallbackGlobal(callback);
}

/**
 * Sets a callback function to be executed when a result is ready
 *
 * This function allows setting a callback that will be executed when
 * an onResultReady message is received, with the payload containing instanceContext and result
 * information passed to it. The callback can be either synchronous or
 * asynchronous (async function).
 *
 * @param callback - The callback function to execute when a result is ready (can be async)
 * @example
 * ```typescript
 * // Set a synchronous callback to be executed when a result is ready
 * setOnResultReadyCallback((payload) => {
 *   console.log('Result ready:', payload.result);
 *   console.log('Task UID:', payload.result.taskUid);
 *   console.log('Submission UID:', payload.result.submissionUid);
 *   console.log('Status:', payload.result.status);
 *   console.log('Instance UID:', payload.instanceContext.instanceUid);
 * });
 *
 * // Set an asynchronous callback to be executed when a result is ready
 * setOnResultReadyCallback(async (payload) => {
 *   console.log('Result ready:', payload.result);
 *   // Perform async actions with the result information
 *   await someAsyncOperation(payload.result);
 *   console.log('Async operations completed');
 * });
 * ```
 */
export function setOnResultReadyCallback(callback: OnResultReadyCallback): void {
    setOnResultReadyCallbackGlobal(callback);
}

/**
 * Executes the onInitCallback if it's set
 *
 * @param data - callback data
 * @internal
 */
export function executeOnInitCallback(data: EnvironmentData): void {
    const callback = getOnInitCallback();
    if (callback) {
        // Call the callback, which may return a Promise
        callback(data);
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
    const callback = getOnTaskLoadedCallback();
    if (callback) {
        // Call the callback, which may return a Promise
        const result = callback(data.payload);
        // No need to await the Promise as we're not using the result
    }
}

/**
 * Handles onTaskSubmitted messages from PumpRoom iframes
 *
 * @param event - The message event
 * @internal
 */
export function handleTaskSubmittedMessage(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event, 'onTaskSubmitted');
    if (!data) return;

    // Execute the onTaskSubmitted callback if it's set
    const callback = getOnTaskSubmittedCallback();
    if (callback) {
        // Call the callback, which may return a Promise
        const result = callback(data.payload);
        // No need to await the Promise as we're not using the result
    }
}

/**
 * Handles onResultReady messages from PumpRoom iframes
 *
 * @param event - The message event
 * @internal
 */
export function handleResultReadyMessage(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event, 'onResultReady');
    if (!data) return;

    // Execute the onResultReady callback if it's set
    const callback = getOnResultReadyCallback();
    if (callback) {
        // Call the callback, which may return a Promise
        const result = callback(data.payload);
        // No need to await the Promise as we're not using the result
    }
}

/**
 * Sets up a listener for task-related messages
 *
 * This function adds event listeners to the window to handle
 * messages related to tasks and results from PumpRoom iframes.
 */
export function setTaskListener(): void {
    window.addEventListener('message', handleTaskLoadedMessage);
    window.addEventListener('message', handleTaskSubmittedMessage);
    window.addEventListener('message', handleResultReadyMessage);
}
