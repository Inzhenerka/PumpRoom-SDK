import { DEFAULT_TRUSTED_ORIGINS } from "./constants.ts";
import { buildEnvironment } from "./environment.ts";
import {
  getConfig,
  getCurrentUser,
  registerTaskInstance,
  unregisterTaskInstance,
} from "./globals.ts";
import {
  getPumpRoomEventMessage,
  registerManagedFrame,
  unregisterManagedFrame,
} from "./messaging.ts";
import type {
  InstanceContext,
  LoadedTaskData,
  OnInitCallback,
  OnResultReadyCallback,
  OnTaskLoadedCallback,
  OnTaskSubmittedCallback,
  OnTaskResultChangedCallback,
  PumpRoomUser,
} from "./types/index.ts";

/**
 * Settings for a single managed task iframe.
 * @category Tasks
 */
export interface MountTaskOptions {
  /** Complete HTTP(S) task URL, including its realm. Its origin is trusted for this iframe only. */
  url: string;
  /** Expected task UID; unrelated task events are ignored when supplied. */
  taskUid?: string;
  /** Accessible iframe title. Defaults to "PumpRoom task". */
  title?: string;
  /** Initial iframe height in pixels. Defaults to 600. */
  height?: number;
  /** Milliseconds to wait for onTaskLoaded, not the HTML load event. Defaults to 30000. */
  timeoutMs?: number;
  /** Abort mounting or destroy an already mounted task. */
  signal?: AbortSignal;
  /** Explicit credentials; omitted captures the current SDK user. Null forces anonymous mode. */
  user?: PumpRoomUser | null;
  /** Called for this iframe's environment handshake. */
  onInit?: OnInitCallback;
  /** Called when this iframe loads a task. */
  onTaskLoaded?: OnTaskLoadedCallback;
  /** Called when this iframe submits a task. */
  onTaskSubmitted?: OnTaskSubmittedCallback;
  /** Called when a submission result becomes available. */
  onResultReady?: OnResultReadyCallback;
  /** Called when the task's saved result changes. */
  onTaskResultChanged?: OnTaskResultChangedCallback;
  /** Receives timeout, load and callback errors. Defaults to console.error. */
  onError?: (error: Error) => void;
}

/**
 * A task iframe owned by the SDK.
 * @category Tasks
 */
export interface MountedTask {
  /** DOM element, available for styling. Do not change its URL; destroy and mount again. */
  readonly iframe: HTMLIFrameElement;
  /** Resolves on the first matching onTaskLoaded; rejects on timeout, error or early destruction. */
  readonly ready: Promise<LoadedTaskData>;
  /** Remove the iframe, its listeners, timer and registered instances. Idempotent. */
  destroy(): void;
}

/** @internal */
export function validateTaskMount(container: HTMLElement, options: MountTaskOptions): URL {
  if (
    typeof document === "undefined" ||
    container.ownerDocument !== document ||
    !container.isConnected
  ) {
    throw new Error("Task container must be attached to the current document");
  }
  const url = new URL(options.url);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    throw new Error("Task URL must be HTTP(S) without credentials");
  }
  for (const value of [options.height ?? 600, options.timeoutMs ?? 30000]) {
    if (!Number.isFinite(value) || value <= 0 || value > 2147483647)
      throw new Error("Task height and timeout must be positive finite numbers");
  }
  if (options.taskUid !== undefined && !options.taskUid.trim())
    throw new Error("Task UID must not be empty");
  if (options.signal?.aborted) throw new DOMException("Task mounting aborted", "AbortError");
  return url;
}

/**
 * Mount an iframe with isolated events and a snapshot of the current SDK environment/user.
 * Does not authenticate or replace global callbacks. Use user: null for anonymous previews.
 * @category Tasks
 */
export function mountTask(container: HTMLElement, options: MountTaskOptions): MountedTask {
  const url = validateTaskMount(container, options);
  const config = getConfig();
  const user = options.user === undefined ? getCurrentUser() : options.user;
  const trustedOrigins: readonly string[] = config?.trustedOrigins ?? DEFAULT_TRUSTED_ORIGINS;
  // Never send an inherited identity into a different realm or untrusted deployment.
  if (
    user &&
    (url.searchParams.get("realm") !== config?.realm || trustedOrigins.indexOf(url.origin) === -1)
  ) {
    throw new Error("Authenticated task URL must match the configured realm and trusted origin");
  }
  const credentials = user ? { ...user } : null;
  const environment = buildEnvironment();
  if (environment.context) environment.context = { ...environment.context };
  const iframe = document.createElement("iframe");
  iframe.title = options.title ?? "PumpRoom task";
  iframe.allow = "clipboard-write; fullscreen";
  iframe.style.cssText = `display:block;width:100%;height:${options.height ?? 600}px;border:0`;
  iframe.src = url.href;
  const scope = { iframe, origin: url.origin };
  const instances = new Map<string, InstanceContext>();
  let destroyed = false;
  let settled = false;
  let scrollY = 0;
  let resolveReady!: (data: LoadedTaskData) => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<LoadedTaskData>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  // A fire-and-forget mount must not cause unhandled rejections; callers still receive rejection.
  void ready.catch(() => {});
  const report = (error: unknown) => {
    if (destroyed) return;
    const normalized = error instanceof Error ? error : new Error(String(error));
    try {
      (options.onError ?? console.error)(normalized);
    } catch (handlerError) {
      console.error(handlerError);
    }
  };
  const call = <T>(callback: ((data: T) => void | Promise<void>) | undefined, data: T) => {
    try {
      void Promise.resolve(callback?.(data)).catch(report);
    } catch (error) {
      report(error);
    }
  };
  const remember = (context: InstanceContext | undefined): boolean => {
    if (!context || typeof context.instanceUid !== "string" || !context.instanceUid) return false;
    instances.set(context.instanceUid, context);
    registerTaskInstance(context);
    return true;
  };
  const matchesTask = (uid: unknown) =>
    typeof uid === "string" && !!uid && (!options.taskUid || uid === options.taskUid);
  const onMessage = (event: MessageEvent) => {
    if (destroyed) return;
    const handshake = getPumpRoomEventMessage(event, "getEnvironment", scope);
    if (handshake && remember(handshake.payload?.instanceContext)) {
      iframe.contentWindow?.postMessage(
        { service: "pumproom", type: "setEnvironment", payload: environment },
        url.origin,
      );
      call(options.onInit, handshake.payload);
      return;
    }
    if (getPumpRoomEventMessage(event, "getPumpRoomUser", scope)) {
      if (credentials)
        iframe.contentWindow?.postMessage(
          { service: "pumproom", type: "setPumpRoomUser", payload: credentials },
          url.origin,
        );
      return;
    }
    const loaded = getPumpRoomEventMessage(event, "onTaskLoaded", scope);
    if (
      loaded &&
      matchesTask(loaded.payload?.task?.uid) &&
      remember(loaded.payload?.instanceContext)
    ) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolveReady(loaded.payload);
      }
      call(options.onTaskLoaded, loaded.payload);
      return;
    }
    const submitted = getPumpRoomEventMessage(event, "onTaskSubmitted", scope);
    if (
      submitted &&
      matchesTask(submitted.payload?.task?.uid) &&
      remember(submitted.payload?.instanceContext)
    )
      call(options.onTaskSubmitted, submitted.payload);
    const result = getPumpRoomEventMessage(event, "onTaskResultChanged", scope);
    if (
      result &&
      matchesTask(result.payload?.task?.uid) &&
      remember(result.payload?.instanceContext)
    )
      call(options.onTaskResultChanged, result.payload);
    const submission = getPumpRoomEventMessage(event, "onResultReady", scope);
    if (
      submission &&
      matchesTask(submission.payload?.result?.taskUid) &&
      remember(submission.payload?.instanceContext)
    )
      call(options.onResultReady, submission.payload);
    const fullscreen = getPumpRoomEventMessage(event, "toggleFullscreen", scope);
    if (fullscreen?.payload?.fullscreenState === true) scrollY = window.scrollY;
    if (fullscreen?.payload?.fullscreenState === false)
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(timer);
    window.removeEventListener("message", onMessage);
    iframe.removeEventListener("error", onLoadError);
    options.signal?.removeEventListener("abort", destroy);
    iframe.remove();
    unregisterManagedFrame(iframe);
    instances.forEach(unregisterTaskInstance);
    instances.clear();
    if (!settled) {
      settled = true;
      rejectReady(new DOMException("Task destroyed before becoming ready", "AbortError"));
    }
  };
  const fail = (error: Error) => {
    if (!settled) {
      settled = true;
      rejectReady(error);
    }
    report(error);
    destroy();
  };
  const onLoadError = () => fail(new Error("Task iframe failed to load"));
  const timer = setTimeout(
    () => fail(new Error("Task readiness timed out")),
    options.timeoutMs ?? 30000,
  );
  registerManagedFrame(iframe);
  window.addEventListener("message", onMessage);
  iframe.addEventListener("error", onLoadError);
  options.signal?.addEventListener("abort", destroy, { once: true });
  container.appendChild(iframe);
  return { iframe, ready, destroy };
}
