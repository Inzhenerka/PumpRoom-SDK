import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { authenticate } from "../src/auth.ts";
import { mountScormTask, type MountedScormTask } from "../src/scorm/mount.ts";

vi.mock("../src/auth.ts", () => ({ authenticate: vi.fn() }));
const options = {
  apiKey: "key",
  realm: "school",
  url: "https://tasks.example.test/?realm=school",
  taskUid: "task",
  lmsId: "lms",
  scormVersion: "2004" as const,
  timeoutMs: 1000,
};
const user = { uid: "alice", token: "token", is_admin: false };
let container: HTMLDivElement;
let values: Record<string, string>;
let api: Record<string, ReturnType<typeof vi.fn>>;
let mounted: MountedScormTask | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  values = {
    "cmi.learner_id": "student:42",
    "cmi.learner_name": "Student",
    "cmi.completion_status": "incomplete",
  };
  api = {
    Initialize: vi.fn(() => "true"),
    Terminate: vi.fn(() => "true"),
    GetValue: vi.fn((field) => values[field] ?? ""),
    SetValue: vi.fn((field, value) => {
      values[field] = value;
      return "true";
    }),
    Commit: vi.fn(() => "true"),
    GetLastError: vi.fn(() => "0"),
    GetErrorString: vi.fn(() => "Error"),
  };
  Object.assign(window, { API_1484_11: api });
  vi.mocked(authenticate).mockResolvedValue(user);
  container = document.createElement("div");
  document.body.append(container);
});
afterEach(() => {
  mounted?.destroy();
  mounted = undefined;
  delete (window as unknown as Record<string, unknown>).API_1484_11;
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.clearAllMocks();
});
function send(type: string, extra = {}) {
  const frame = container.querySelector("iframe")!;
  window.dispatchEvent(
    new MessageEvent("message", {
      origin: "https://tasks.example.test",
      source: frame.contentWindow,
      data: {
        service: "pumproom",
        type,
        payload: { task: { uid: "task" }, instanceContext: { instanceUid: "frame" }, ...extra },
      },
    }),
  );
}
it("authenticates before mounting and forwards saved results to the LMS", async () => {
  const pending = mountScormTask(container, options);
  expect(container.querySelector("iframe")).toBeNull();
  await Promise.resolve();
  expect(authenticate).toHaveBeenCalledWith({
    identity: { provider: "lms", id: "lms:student%3A42", name: "Student" },
  });
  send("onTaskLoaded");
  mounted = await pending;
  send("onTaskResultChanged", {
    taskResult: {
      completion_status: "completed",
      success_status: "passed",
      score: 100,
      progress: 1,
      revision: 1,
      updated_at: null,
    },
  });
  expect(values["cmi.score.raw"]).toBe("100");
  expect(api.Commit).toHaveBeenCalledOnce();
  mounted.destroy();
  mounted.destroy();
  expect(api.Terminate).toHaveBeenCalledOnce();
  expect(container.querySelector("iframe")).toBeNull();
});
it("supports an existing identity mapping", async () => {
  const pending = mountScormTask(container, {
    ...options,
    mapLearner: ({ id }) => ({ provider: "lms", id }),
  });
  await Promise.resolve();
  send("onTaskLoaded");
  mounted = await pending;
  expect(authenticate).toHaveBeenCalledWith({ identity: { provider: "lms", id: "student:42" } });
});
it("forwards embedding callbacks and reports to the LMS before the result callback", async () => {
  const onInit = vi.fn();
  const onTaskLoaded = vi.fn();
  const onTaskSubmitted = vi.fn();
  const onResultReady = vi.fn();
  const onTaskResultChanged = vi.fn(() => {
    expect(api.Commit).toHaveBeenCalledOnce();
  });
  const pending = mountScormTask(container, {
    ...options,
    onInit,
    onTaskLoaded,
    onTaskSubmitted,
    onResultReady,
    onTaskResultChanged,
  });
  await Promise.resolve();
  send("getEnvironment");
  send("onTaskLoaded");
  mounted = await pending;
  send("onTaskSubmitted");
  send("onResultReady", { result: { taskUid: "task" } });
  send("onTaskResultChanged", {
    taskResult: {
      completion_status: "completed",
      success_status: "passed",
      score: 100,
      progress: 1,
      revision: 1,
      updated_at: null,
    },
  });
  for (const callback of [
    onInit,
    onTaskLoaded,
    onTaskSubmitted,
    onResultReady,
    onTaskResultChanged,
  ])
    expect(callback).toHaveBeenCalledOnce();
});
it("keeps result callbacks available after LMS failure and reports async callback errors", async () => {
  const onError = vi.fn();
  const callbackError = new Error("Callback failed");
  const onTaskResultChanged = vi.fn(async () => {
    throw callbackError;
  });
  const pending = mountScormTask(container, { ...options, onError, onTaskResultChanged });
  await Promise.resolve();
  send("onTaskLoaded");
  mounted = await pending;
  api.Commit.mockReturnValueOnce("false");
  send("onTaskResultChanged", {
    taskResult: {
      completion_status: "completed",
      success_status: "passed",
      score: 100,
      progress: 1,
      revision: 1,
      updated_at: null,
    },
  });
  await Promise.resolve();
  expect(onTaskResultChanged).toHaveBeenCalledOnce();
  expect(onError).toHaveBeenCalledTimes(2);
  expect(onError.mock.calls[0][0].message).toContain("SCORM Commit failed");
  expect(onError).toHaveBeenLastCalledWith(callbackError);
  expect(container.querySelector("iframe")).toBe(mounted.iframe);
});
it("terminates without creating an iframe when authentication fails", async () => {
  vi.mocked(authenticate).mockRejectedValueOnce(new Error("Auth failed"));
  await expect(mountScormTask(container, options)).rejects.toThrow("Auth failed");
  expect(container.children).toHaveLength(0);
  expect(api.Terminate).toHaveBeenCalledOnce();
});
it("does not mount after cancellation during authentication", async () => {
  let resolve!: (value: typeof user) => void;
  vi.mocked(authenticate).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const abort = new AbortController();
  const pending = mountScormTask(container, { ...options, signal: abort.signal });
  abort.abort();
  resolve(user);
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(container.children).toHaveLength(0);
  expect(api.Terminate).toHaveBeenCalledOnce();
});
it("cleans up the iframe and SCORM session on readiness timeout", async () => {
  const onError = vi.fn();
  const pending = mountScormTask(container, { ...options, onError });
  const rejected = expect(pending).rejects.toThrow("timed out");
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(1000);
  await rejected;
  expect(api.Terminate).toHaveBeenCalledOnce();
  expect(container.children).toHaveLength(0);
});
it("requires a real LMS and matching realm", async () => {
  await expect(mountScormTask(container, { ...options, realm: "other" })).rejects.toThrow("realm");
  expect(api.Initialize).not.toHaveBeenCalled();
  delete (window as unknown as Record<string, unknown>).API_1484_11;
  await expect(mountScormTask(container, options)).rejects.toThrow("not accessible");
  expect(authenticate).not.toHaveBeenCalled();
});
