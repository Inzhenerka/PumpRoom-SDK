import type { TaskResultData } from "../types/index.ts";
import { discoverApi, type ScormVersion } from "./discovery.ts";
import { formatSessionTime, mapResult } from "./mapping.ts";

/**
 * Supported SCORM run-time versions.
 * @category SCORM
 */
export type { ScormVersion } from "./discovery.ts";

/**
 * Configuration for one SCO reporting one embedded PumpRoom task.
 * @category SCORM
 */
export interface ScormOptions {
  /** Only events for this task UID are reported. */
  taskUid: string;
  /** Optional iframe instance filter when a task is embedded more than once. */
  instanceUid?: string;
  /** Expected manifest version; omit to detect the nearest accessible API. */
  version?: ScormVersion;
  /** Launch window; defaults to the current browser window. */
  window?: Window;
  /** Commit on pagehide, terminate unless entering bfcache. Defaults to true. */
  autoFinish?: boolean;
  /** Receives errors during automatic pagehide handling; defaults to console.error. */
  onError?: (error: Error) => void;
}

/**
 * Learner identity as reported by the LMS, without interpreting it as an email.
 * @category SCORM
 */
export interface ScormLearner {
  /** LMS-local identifier; scope it to the LMS installation when authenticating. */
  id: string;
  /** Display name in the LMS's original format. */
  name: string;
}

/**
 * Explicitly initialized SCORM session owned by the launch page.
 * @category SCORM
 */
export interface ScormConnection {
  /** Detected run-time version. */
  readonly version: ScormVersion;
  /** Whether the session has successfully terminated. */
  readonly finished: boolean;
  /** Read the learner from the LMS. Throws on a failed SCORM read. */
  getLearner(): ScormLearner;
  /** Report and commit a task event. False means null, initial, duplicate or unrelated data. */
  handleTaskResult(data: TaskResultData): boolean;
  /** Persist pending values and elapsed session time. Throws on failure. */
  commit(): void;
  /** Persist, set exit state and terminate. Repeated successful calls are harmless. */
  finish(): void;
}

/**
 * SCORM operation rejected by the LMS.
 * @category SCORM
 */
export class ScormError extends Error {
  /** Name of the rejected API operation, including the field for reads and writes. */
  readonly operation: string;
  /** LMS error code, when available. */
  readonly code: string;
  /** @internal */
  constructor(operation: string, code: string, detail: string) {
    super(`SCORM ${operation} failed (${code}): ${detail}`);
    this.name = "ScormError";
    this.operation = operation;
    this.code = code;
  }
}

const ownedApis = new WeakSet<object>();

/**
 * Initialize the LMS API from the SCO launch page. Returns null outside an accessible LMS.
 * No SDK callbacks are replaced and importing this module has no browser side effects.
 * Pass handleTaskResult to the SDK's task-result callback before loading the task iframe.
 * @category SCORM
 */
export function connectScorm(options: ScormOptions): ScormConnection | null {
  if (!options.taskUid.trim()) throw new Error("SCORM taskUid is required");
  if (options.version !== undefined && options.version !== "1.2" && options.version !== "2004") {
    throw new Error("Unsupported SCORM version");
  }
  const launchWindow = options.window ?? (typeof window !== "undefined" ? window : undefined);
  if (!launchWindow) return null;
  const found = discoverApi(launchWindow, options.version);
  if (!found) return null;
  const { api, version } = found;
  if (ownedApis.has(api)) throw new Error("SCORM API already connected in this document");
  const prefix = version === "1.2" ? "LMS" : "";
  const invoke = (name: string, ...args: string[]) => api[prefix + name](...args);
  const failure = (operation: string) => {
    let code = "unknown";
    let detail = "LMS rejected the operation";
    try {
      code = String(invoke("GetLastError"));
      detail = String(invoke("GetErrorString", code));
    } catch {
      /* Preserve the original failure if diagnostics also fail. */
    }
    return new ScormError(operation, code, detail);
  };
  const write = (name: string, ...args: string[]) => {
    const value = invoke(name, ...args);
    if (value !== "true" && value !== true) throw failure(`${name}${args[0] ? ` ${args[0]}` : ""}`);
  };
  const read = (name: string): string => {
    const value = invoke("GetValue", name);
    if (String(invoke("GetLastError")) !== "0") throw failure(`GetValue ${name}`);
    return String(value);
  };
  write("Initialize", "");
  ownedApis.add(api);
  const startedAt = launchWindow.performance.now();
  const fieldPrefix = version === "1.2" ? "cmi.core" : "cmi";
  let finished = false;
  let revision = -1;
  const requireActive = () => {
    if (finished) throw new Error("SCORM session is already finished");
  };
  const commit = () => {
    requireActive();
    write(
      "SetValue",
      `${fieldPrefix}.session_time`,
      formatSessionTime(launchWindow.performance.now() - startedAt, version),
    );
    write("Commit", "");
  };
  const finish = () => {
    if (finished) return;
    // Read the actual LMS status so reopening without a new result preserves completion.
    const status = read(version === "1.2" ? "cmi.core.lesson_status" : "cmi.completion_status");
    const completed =
      version === "1.2"
        ? ["completed", "passed", "failed"].indexOf(status) !== -1
        : status === "completed";
    write(
      "SetValue",
      `${fieldPrefix}.exit`,
      completed ? (version === "1.2" ? "" : "normal") : "suspend",
    );
    commit();
    write(version === "1.2" ? "Finish" : "Terminate", "");
    finished = true;
    launchWindow.removeEventListener("pagehide", onPageHide);
  };
  const onPageHide = (event: PageTransitionEvent) => {
    try {
      if (event.persisted) commit();
      else finish();
    } catch (error) {
      (options.onError ?? console.error)(error instanceof Error ? error : new Error(String(error)));
    }
  };
  if (options.autoFinish !== false) launchWindow.addEventListener("pagehide", onPageHide);
  return {
    version,
    get finished() {
      return finished;
    },
    getLearner() {
      requireActive();
      return {
        id: read(version === "1.2" ? "cmi.core.student_id" : "cmi.learner_id"),
        name: read(version === "1.2" ? "cmi.core.student_name" : "cmi.learner_name"),
      };
    },
    handleTaskResult(data) {
      requireActive();
      if (
        data.task.uid !== options.taskUid ||
        (options.instanceUid !== undefined &&
          data.instanceContext.instanceUid !== options.instanceUid)
      )
        return false;
      const result = data.taskResult;
      if (result === null) return false;
      const values = mapResult(result, version);
      // Never overwrite an LMS resume with the API's unsaved initial snapshot.
      if (
        result.revision <= revision ||
        (result.revision === 0 && result.completion_status === "not_attempted")
      )
        return false;
      for (const [field, value] of values) write("SetValue", field, value);
      commit();
      revision = result.revision;
      return true;
    },
    commit,
    finish,
  };
}
