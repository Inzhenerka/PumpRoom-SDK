import { authenticate } from "../auth.ts";
import { mountTask, validateTaskMount, type MountedTask, type MountTaskOptions } from "../embed.ts";
import { init } from "../init.ts";
import type { LMSIdentityInput, PumpRoomConfig } from "../types/index.ts";
import {
  connectScorm,
  type ScormConnection,
  type ScormLearner,
  type ScormVersion,
} from "./index.ts";

/**
 * Configuration for a SCO containing one authenticated PumpRoom task.
 * @category SCORM
 */
export interface MountScormTaskOptions
  extends
    Pick<PumpRoomConfig, "apiKey" | "realm" | "apiBaseUrl" | "pageUrl" | "cacheUser" | "context">,
    Omit<MountTaskOptions, "user" | "taskUid"> {
  /** UID of the task whose results should be reported to the LMS. */
  taskUid: string;
  /** Stable identifier for the LMS installation, used to namespace learner IDs. */
  lmsId: string;
  /** SCORM version declared by imsmanifest.xml. */
  scormVersion: ScormVersion;
  /** Override identity mapping for existing integrations. Default: encoded lmsId:learnerId. */
  mapLearner?: (learner: ScormLearner) => LMSIdentityInput;
}

/**
 * Mounted SCO; destroying it also persists and terminates its SCORM session.
 * @category SCORM
 */
export interface MountedScormTask extends MountedTask {
  /** Session for explicit commits or access to LMS learner data. */
  readonly scorm: ScormConnection;
}

/**
 * Connect to the LMS, authenticate its learner, mount the task and forward its results.
 * Resolves when the task is ready. Use an AbortSignal to cancel startup or close the SCO.
 * Owns the page's SDK configuration; use one SCORM mount per launch document.
 * @category SCORM
 */
export async function mountScormTask(
  container: HTMLElement,
  options: MountScormTaskOptions,
): Promise<MountedScormTask> {
  const url = validateTaskMount(container, options);
  if (!options.taskUid.trim() || !options.lmsId.trim())
    throw new Error("SCORM taskUid and lmsId are required");
  if (url.searchParams.get("realm") !== options.realm)
    throw new Error("SCORM task URL realm does not match configuration");
  const report = (error: unknown) => {
    try {
      (options.onError ?? console.error)(error instanceof Error ? error : new Error(String(error)));
    } catch (handlerError) {
      console.error(handlerError);
    }
  };
  const scorm = connectScorm({
    taskUid: options.taskUid,
    version: options.scormVersion,
    onError: report,
  });
  if (!scorm) throw new Error("SCORM API is not accessible from the launch page");
  let task: MountedTask | undefined;
  let closed = false;
  const destroy = () => {
    if (closed) return;
    try {
      scorm.finish();
    } finally {
      closed = true;
      options.signal?.removeEventListener("abort", onAbort);
      task?.destroy();
    }
  };
  const onAbort = () => {
    try {
      destroy();
    } catch (error) {
      report(error);
    }
  };
  options.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const learner = scorm.getLearner();
    if (!learner.id.trim()) throw new Error("LMS learner ID is missing");
    init({
      apiKey: options.apiKey,
      realm: options.realm,
      apiBaseUrl: options.apiBaseUrl,
      pageUrl: options.pageUrl,
      cacheUser: options.cacheUser ?? false,
      context: options.context,
      trustedOrigins: [url.origin],
    });
    const user = await authenticate({
      ...(options.signal ? { signal: options.signal } : {}),
      identity: options.mapLearner
        ? options.mapLearner(learner)
        : {
            provider: "lms",
            id: `${encodeURIComponent(options.lmsId)}:${encodeURIComponent(learner.id)}`,
            name: learner.name,
          },
    });
    if (closed || options.signal?.aborted)
      throw new DOMException("SCORM mounting aborted", "AbortError");
    task = mountTask(container, {
      ...options,
      url: url.href,
      user,
      // The outer handler owns cancellation and finishes SCORM before removing the iframe.
      signal: undefined,
      onError: report,
      onTaskResultChanged: (data) => {
        try {
          scorm.handleTaskResult(data);
        } catch (error) {
          report(error);
        }
        return options.onTaskResultChanged?.(data);
      },
    });
    await task.ready;
    if (closed) throw new DOMException("SCORM mounting aborted", "AbortError");
    return { iframe: task.iframe, ready: task.ready, scorm, destroy };
  } catch (error) {
    try {
      destroy();
    } catch (finishError) {
      report(finishError);
    }
    throw error;
  }
}
