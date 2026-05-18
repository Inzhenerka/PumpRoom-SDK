/**
 * PumpRoom SDK
 *
 * This module provides the main functionality for integrating with the PumpRoom platform.
 * It handles initialization, authentication, and user management.
 * @categoryDescription Initialization
 *  Functions for initializing and configuring the SDK. They must be called before using any other SDK functionality.
 * @categoryDescription Authentication
 *  Functions for user authentication and management, including setting and retrieving user information.
 * @categoryDescription Callbacks
 *  Functions for setting up event handlers and callback functions that respond to SDK lifecycle events.
 * @categoryDescription Tasks
 *  Functions for working with task instances and retrieving task-related information.
 * @categoryDescription States
 *  [Experimental] Functions for managing persistent state data, including storing, retrieving, and clearing application states.
 * @categoryDescription Courses
 *  [Experimental] Functions for loading course information with local caching.
 * @module PumpRoomSDK
 */

import { initApiClient } from "./api-client.ts";
import { setTaskListener } from "./callbacks.ts";
import { setEnvironmentListener } from "./environment.ts";
import { setFullscreenListener } from "./fullscreen.ts";
import { setConfig } from "./globals.ts";
import { enforceIframeHeight } from "./iframe.ts";
import { PumpRoomConfig } from "./types/index.ts";
import { getVersion } from "./version.ts";

export { authenticate, setUser } from "./auth.ts";
export {
  setOnInitCallback,
  setOnResultReadyCallback,
  setOnTaskLoadedCallback,
  setOnTaskSubmittedCallback,
} from "./callbacks.ts";
export { loadCourseData } from "./course.ts";
export { getCurrentUser } from "./globals.ts";
export { getTaskInstances } from "./instance.ts";
export { clearStates, fetchStates, getRegisteredStates, storeStates } from "./states.ts";
export type {
  AuthenticateOptions,
  CourseDataCallback,
  CourseDataOutput,
  CourseInput,
  EnvironmentData,
  InstanceContext,
  LMSContext,
  LMSContextAPI,
  LMSProfileInput,
  LoadCourseDataInput,
  LoadCourseDataOutput,
  LoadedTaskData,
  OnInitCallback,
  OnResultReadyCallback,
  OnTaskLoadedCallback,
  OnTaskSubmittedCallback,
  PumpRoomConfig,
  PumpRoomUser,
  ResultData,
  State,
  StateDataType,
  StateOutput,
  StatesCallback,
  StatesResponse,
  SubmissionResult,
  SubmissionStatus,
  TaskDataOutput,
  TaskDetails,
  TildaProfileInput,
} from "./types/index.ts";
export { getVersion } from "./version.ts";

console.debug("PumpRoom SDK v" + getVersion() + " loaded");

/**
 * Initializes the PumpRoom SDK with the provided configuration.
 *
 * This function must be called before using any other SDK functionality.
 * It sets up the API client, event listeners, and iframe configuration.
 *
 * @param cfg - The SDK configuration object
 * @category Initialization
 * @public
 * @example
 * ```typescript
 * import { init } from 'pumproom-sdk';
 *
 * init({
 *   apiKey: 'your-api-key',
 *   realm: 'your-realm',
 *   cacheUser: true,
 *   minHeight: 500
 * });
 * ```
 */
export function init(cfg: PumpRoomConfig): void {
  setConfig(cfg);
  initApiClient(cfg.apiKey);
  setFullscreenListener();
  setEnvironmentListener();
  setTaskListener();
  if (cfg.minHeight) {
    enforceIframeHeight(cfg.minHeight);
  }
}
