import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getApiClient } from "../src/api-client.ts";
import { setUser } from "../src/auth.ts";
import { setOnTaskLoadedCallback } from "../src/callbacks.ts";
import { mountTask, type MountedTask } from "../src/embed.ts";
import { getTaskInstances, setCurrentUser } from "../src/globals.ts";
import { init } from "../src/init.ts";
import { trustedMessage } from "./test-utils.ts";

const origin = "https://tasks.example.test";
const url = `${origin}/?realm=school`;
const context = {
  instanceUid: "frame",
  realm: "school",
  repoName: "repo",
  taskName: "task",
  tags: undefined,
};
const payload = { instanceContext: context, task: { uid: "task" } };
const user = { uid: "alice", token: "token", is_admin: false };
let container: HTMLDivElement;
const mounted: MountedTask[] = [];
const mount = (options: Partial<Parameters<typeof mountTask>[1]> = {}) => {
  const task = mountTask(container, { url, ...options });
  mounted.push(task);
  return task;
};
function message(
  task: MountedTask,
  type: string,
  data: unknown = payload,
  patch: MessageEventInit = {},
) {
  window.dispatchEvent(
    new MessageEvent("message", {
      origin,
      source: task.iframe.contentWindow,
      data: { service: "pumproom", type, payload: data },
      ...patch,
    }),
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  document.body.append(container);
  init({ apiKey: "key", realm: "school", trustedOrigins: [origin], cacheUser: false });
  setCurrentUser(null);
});
afterEach(() => {
  mounted.splice(0).forEach((task) => task.destroy());
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("mountTask", () => {
  it("waits for the task event, not iframe load, and keeps global callbacks separate", async () => {
    const local = vi.fn();
    const global = vi.fn();
    setOnTaskLoadedCallback(global);
    const task = mount({ onTaskLoaded: local, taskUid: "task", height: 420 });
    expect(task.iframe.style.height).toBe("420px");
    expect(task.iframe.title).toBe("PumpRoom task");
    const ready = vi.fn();
    void task.ready.then(ready);
    task.iframe.dispatchEvent(new Event("load"));
    await Promise.resolve();
    expect(ready).not.toHaveBeenCalled();
    message(task, "onTaskLoaded");
    await expect(task.ready).resolves.toEqual(payload);
    expect(local).toHaveBeenCalledOnce();
    expect(global).not.toHaveBeenCalled();
    const manual = document.createElement("iframe");
    manual.src = url;
    container.append(manual);
    window.dispatchEvent(
      trustedMessage({
        origin,
        source: manual.contentWindow,
        data: { service: "pumproom", type: "onTaskLoaded", payload },
      }),
    );
    expect(global).toHaveBeenCalledOnce();
  });
  it("isolates simultaneous frames and rejects forged or malformed messages", async () => {
    const callback = vi.fn();
    const first = mount({ taskUid: "task", onTaskResultChanged: callback });
    const second = mount();
    const ready = vi.fn();
    void first.ready.then(ready);
    message(first, "onTaskLoaded", payload, { origin: "https://evil.test" });
    message(first, "onTaskLoaded", payload, { source: window });
    message(first, "onTaskLoaded", null);
    message(first, "onTaskLoaded", { ...payload, task: { uid: "nested" } });
    message(second, "onTaskLoaded");
    message(second, "onTaskResultChanged", { ...payload, taskResult: null });
    await Promise.resolve();
    expect(ready).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    message(first, "onTaskLoaded");
    await first.ready;
    message(first, "onTaskResultChanged", { ...payload, taskResult: null });
    expect(callback).toHaveBeenCalledOnce();
  });
  it("captures verified credentials and environment without leaking them to anonymous frames", async () => {
    vi.spyOn(getApiClient(), "verifyToken").mockResolvedValue({ is_valid: true, is_admin: false });
    await setUser(user);
    const first = mount();
    const anonymous = mount({ user: null });
    const firstPost = vi.spyOn(first.iframe.contentWindow!, "postMessage");
    const anonymousPost = vi.spyOn(anonymous.iframe.contentWindow!, "postMessage");
    init({
      apiKey: "another",
      realm: "other",
      trustedOrigins: [origin],
      pageUrl: "https://lms.test/other",
    });
    setCurrentUser({ ...user, uid: "bob" });
    message(first, "getPumpRoomUser");
    message(anonymous, "getPumpRoomUser");
    expect(firstPost).toHaveBeenCalledExactlyOnceWith(
      { service: "pumproom", type: "setPumpRoomUser", payload: user },
      origin,
    );
    expect(anonymousPost).not.toHaveBeenCalled();
    message(first, "getEnvironment");
    expect(firstPost.mock.calls[1][0].payload.pageURL).not.toBe("https://lms.test/other");
  });
  it("cleans listeners, instances and timers and rejects pending readiness on destroy", async () => {
    const callback = vi.fn();
    const task = mount({ onTaskLoaded: callback });
    message(task, "getEnvironment");
    expect(getTaskInstances().frame).toEqual(context);
    task.destroy();
    task.destroy();
    expect(task.iframe.isConnected).toBe(false);
    expect(getTaskInstances().frame).toBeUndefined();
    await expect(task.ready).rejects.toMatchObject({ name: "AbortError" });
    message(task, "onTaskLoaded");
    expect(callback).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(callback).not.toHaveBeenCalled();
  });
  it("reports timeout and removes the failed iframe", async () => {
    const onError = vi.fn();
    const task = mount({ timeoutMs: 100, onError });
    vi.advanceTimersByTime(100);
    await expect(task.ready).rejects.toThrow("timed out");
    expect(onError).toHaveBeenCalledOnce();
    expect(task.iframe.isConnected).toBe(false);
  });
  it("reports iframe errors", async () => {
    const onError = vi.fn();
    const task = mount({ onError });
    task.iframe.dispatchEvent(new Event("error"));
    await expect(task.ready).rejects.toThrow("failed to load");
    expect(onError).toHaveBeenCalledOnce();
    expect(task.iframe.isConnected).toBe(false);
  });
  it("handles cancellation before and after readiness without treating it as a load error", async () => {
    const abort = new AbortController();
    const onError = vi.fn();
    const task = mount({ signal: abort.signal, onError });
    message(task, "onTaskLoaded");
    await task.ready;
    abort.abort();
    expect(task.iframe.isConnected).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    expect(() => mount({ signal: abort.signal })).toThrow("aborted");
  });
  it("reports both synchronous and asynchronous callback errors", async () => {
    const onError = vi.fn();
    const task = mount({
      onError,
      onTaskLoaded: () => {
        throw new Error("sync");
      },
      onTaskSubmitted: async () => {
        throw new Error("async");
      },
    });
    message(task, "onTaskLoaded");
    await task.ready;
    message(task, "onTaskSubmitted");
    await Promise.resolve();
    expect(onError).toHaveBeenCalledTimes(2);
  });
  it("rejects invalid options before creating any iframe", () => {
    expect(() => mount({ url: "javascript:alert(1)" })).toThrow("HTTP(S)");
    expect(() => mount({ url: "https://user:pass@tasks.example.test" })).toThrow("credentials");
    expect(() => mount({ timeoutMs: 0 })).toThrow("positive");
    expect(() => mount({ height: NaN })).toThrow("positive");
    expect(() => mountTask(document.createElement("div"), { url })).toThrow("attached");
    setCurrentUser(user);
    expect(() => mount({ url: `${origin}/?realm=other` })).toThrow("realm");
    expect(() => mount({ url: "https://evil.test/?realm=school" })).toThrow("trusted origin");
    expect(container.children).toHaveLength(0);
  });
});
