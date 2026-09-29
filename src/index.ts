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
 *  Task embedding, mounted iframe handles, settings and task instance information.
 * @categoryDescription SCORM
 *  LMS launch, mounted SCO handles, learner identity and SCORM session management.
 * @categoryDescription States
 *  [Experimental] Functions for managing persistent state data, including storing, retrieving, and clearing application states.
 * @categoryDescription Courses
 *  [Experimental] Functions for loading course information with local caching.
 * @module PumpRoomSDK
 */

import { getVersion } from "./version.ts";

export { init } from "./init.ts";
export { mountTask } from "./embed.ts";
export type { MountedTask, MountTaskOptions } from "./embed.ts";
export { mountScormTask } from "./scorm/mount.ts";
export type { MountedScormTask, MountScormTaskOptions } from "./scorm/mount.ts";
export { authenticate, setUser } from "./auth.ts";
export {
  setOnInitCallback,
  setOnResultReadyCallback,
  setOnTaskResultChangedCallback,
  setOnTaskLoadedCallback,
  setOnTaskSubmittedCallback,
} from "./callbacks.ts";
export { loadCourseData } from "./course.ts";
export { getCurrentUser } from "./globals.ts";
export { getTaskInstances } from "./instance.ts";
export { connectScorm, ScormError } from "./scorm/index.ts";
export type { ScormConnection, ScormLearner, ScormOptions, ScormVersion } from "./scorm/index.ts";
export { clearStates, fetchStates, getRegisteredStates, storeStates } from "./states.ts";
export type {
  AuthenticateOptions,
  CompletionStatus,
  CourseDataCallback,
  CourseDataOutput,
  EnvironmentData,
  IdentityProviderType,
  InstanceContext,
  LMSContext,
  LMSContextAPI,
  LMSIdentityInput,
  LoadCourseDataInput,
  LoadCourseDataOutput,
  LoadedTaskData,
  OnInitCallback,
  OnResultReadyCallback,
  OnTaskResultChangedCallback,
  TaskResult,
  TaskResultData,
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
  SuccessStatus,
  TaskDataOutput,
  TaskDetails,
} from "./types/index.ts";
export { getVersion } from "./version.ts";

console.debug("PumpRoom SDK v" + getVersion() + " loaded");
