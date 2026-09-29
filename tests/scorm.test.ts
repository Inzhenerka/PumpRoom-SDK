import { describe, expect, it, vi } from "vitest";

import {
  handleTaskResultChangedMessage,
  setOnTaskResultChangedCallback,
} from "../src/callbacks.ts";
import { connectScorm, ScormError } from "../src/index.ts";
import { discoverApi, type ScormVersion } from "../src/scorm/discovery.ts";
import { formatSessionTime, mapResult } from "../src/scorm/mapping.ts";
import type { TaskResult, TaskResultData } from "../src/types/index.ts";
import { trustedMessage } from "./test-utils.ts";

const result: TaskResult = {
  completion_status: "completed",
  success_status: "passed",
  score: 75,
  progress: 1,
  revision: 1,
  updated_at: "2026-09-29T00:00:00Z",
};
const event = (taskResult: TaskResult | null = result): TaskResultData => ({
  task: { uid: "task" },
  instanceContext: {
    instanceUid: "frame",
    repoName: "repo",
    taskName: "task",
    realm: "test",
    tags: undefined,
  },
  taskResult,
});

function mockLms(version: ScormVersion = "2004") {
  const values: Record<string, string> = {
    "cmi.core.student_id": "student-42",
    "cmi.core.student_name": "Learner, Test",
    "cmi.learner_id": "student-42",
    "cmi.learner_name": "Learner, Test",
    "cmi.core.lesson_status": "incomplete",
    "cmi.completion_status": "incomplete",
  };
  const initialize = vi.fn(() => "true");
  const terminate = vi.fn(() => "true");
  const getValue = vi.fn((key: string) => values[key] ?? "");
  const setValue = vi.fn((key: string, value: string) => {
    values[key] = value;
    return "true";
  });
  const commit = vi.fn(() => "true");
  const getLastError = vi.fn(() => "0");
  const getErrorString = vi.fn(() => "LMS error");
  const prefix = version === "1.2" ? "LMS" : "";
  const api = Object.fromEntries(
    Object.entries({
      Initialize: initialize,
      [version === "1.2" ? "Finish" : "Terminate"]: terminate,
      GetValue: getValue,
      SetValue: setValue,
      Commit: commit,
      GetLastError: getLastError,
      GetErrorString: getErrorString,
    }).map(([key, fn]) => [prefix + key, fn]),
  );
  const now = vi.fn(() => 0);
  const launch = Object.assign(new EventTarget(), {
    [version === "2004" ? "API_1484_11" : "API"]: api,
    performance: { now },
    parent: null,
    opener: null,
  }) as unknown as Window;
  return {
    launch,
    api,
    values,
    initialize,
    terminate,
    setValue,
    getValue,
    commit,
    getLastError,
    now,
  };
}

describe("SCORM mapping", () => {
  it("maps the 2004 score, progress and independent statuses", () => {
    expect(Object.fromEntries(mapResult(result, "2004"))).toEqual({
      "cmi.score.min": "0",
      "cmi.score.max": "100",
      "cmi.score.raw": "75",
      "cmi.score.scaled": "0.75",
      "cmi.progress_measure": "1",
      "cmi.completion_status": "completed",
      "cmi.success_status": "passed",
    });
  });
  it.each([
    ["not_attempted", "unknown", "not attempted"],
    ["incomplete", "failed", "incomplete"],
    ["completed", "unknown", "completed"],
    ["completed", "passed", "passed"],
    ["completed", "failed", "failed"],
  ] as const)("maps 1.2 %s/%s to %s", (completion_status, success_status, status) => {
    expect(
      Object.fromEntries(
        mapResult(
          { ...result, completion_status, success_status, score: null, progress: null },
          "1.2",
        ),
      ),
    ).toEqual({ "cmi.core.lesson_status": status });
  });
  it("keeps unknown scores absent but writes legitimate zero scores and progress", () => {
    expect(mapResult({ ...result, score: null, progress: null }, "2004")).toHaveLength(2);
    const values = Object.fromEntries(mapResult({ ...result, score: 0, progress: 0 }, "2004"));
    expect(values["cmi.score.raw"]).toBe("0");
    expect(values["cmi.score.scaled"]).toBe("0");
    expect(values["cmi.progress_measure"]).toBe("0");
  });
  it.each([{ score: NaN }, { score: 101 }, { score: -1 }, { progress: 2 }, { revision: -1 }])(
    "rejects invalid values %j before writing",
    (patch) => {
      const lms = mockLms();
      const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
      expect(() => scorm.handleTaskResult(event({ ...result, ...patch }))).toThrow(
        "Invalid PumpRoom",
      );
      expect(lms.setValue).not.toHaveBeenCalled();
    },
  );
  it("formats both session duration formats without rounding up or overflow", () => {
    expect(formatSessionTime(3723456, "1.2")).toBe("0001:02:03.45");
    expect(formatSessionTime(3723456, "2004")).toBe("PT3723.45S");
    expect(formatSessionTime(1e12, "1.2")).toBe("9999:59:59.99");
  });
});

describe.each(["1.2", "2004"] as const)("SCORM %s connection", (version) => {
  it("reports trusted SDK events but ignores messages outside its iframe boundary", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    setOnTaskResultChangedCallback((data) => {
      scorm.handleTaskResult(data);
    });
    const data = { service: "pumproom", type: "onTaskResultChanged", payload: event() };
    handleTaskResultChangedMessage(trustedMessage({ data, origin: "https://untrusted.example" }));
    handleTaskResultChangedMessage(trustedMessage({ data, source: window }));
    expect(lms.commit).not.toHaveBeenCalled();
    handleTaskResultChangedMessage(trustedMessage({ data }));
    expect(lms.commit).toHaveBeenCalledTimes(1);
    scorm.finish();
    setOnTaskResultChangedCallback(() => {});
  });
  it("preserves a resumed completion when only an initial empty snapshot arrives", () => {
    const lms = mockLms(version);
    const statusField = version === "1.2" ? "cmi.core.lesson_status" : "cmi.completion_status";
    lms.values[statusField] = "completed";
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    scorm.handleTaskResult(
      event({
        ...result,
        revision: 0,
        completion_status: "not_attempted",
        success_status: "unknown",
        score: null,
        progress: null,
      }),
    );
    scorm.finish();
    expect(lms.values[statusField]).toBe("completed");
    expect(lms.values[version === "1.2" ? "cmi.core.exit" : "cmi.exit"]).toBe(
      version === "1.2" ? "" : "normal",
    );
  });
  it("reports read errors and allows retrying a rejected termination", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    lms.getLastError.mockReturnValueOnce("301");
    expect(() => scorm.getLearner()).toThrow(ScormError);
    lms.terminate.mockReturnValueOnce("false");
    expect(() => scorm.finish()).toThrow(ScormError);
    expect(scorm.finished).toBe(false);
    scorm.finish();
    expect(scorm.finished).toBe(true);
  });
  it("initializes once, reads the learner, commits and finishes idempotently", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", version, window: lms.launch })!;
    expect(scorm.version).toBe(version);
    expect(scorm.getLearner()).toEqual({ id: "student-42", name: "Learner, Test" });
    expect(lms.initialize).toHaveBeenCalledExactlyOnceWith("");
    expect(() => connectScorm({ taskUid: "task", window: lms.launch })).toThrow(
      "already connected",
    );
    expect(scorm.handleTaskResult(event())).toBe(true);
    lms.now.mockReturnValue(10000);
    scorm.finish();
    scorm.finish();
    expect(lms.terminate).toHaveBeenCalledExactlyOnceWith("");
    expect(lms.values[version === "1.2" ? "cmi.core.exit" : "cmi.exit"]).toBe(
      version === "1.2" ? "" : "normal",
    );
    expect(lms.values[version === "1.2" ? "cmi.core.session_time" : "cmi.session_time"]).toBe(
      version === "1.2" ? "0000:00:10.00" : "PT10S",
    );
    expect(scorm.finished).toBe(true);
    expect(() => scorm.commit()).toThrow("finished");
    expect(() => scorm.handleTaskResult(event())).toThrow("finished");
  });
  it("suspends unfinished work without changing its status", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    scorm.finish();
    expect(lms.values[version === "1.2" ? "cmi.core.exit" : "cmi.exit"]).toBe("suspend");
    expect(lms.values[version === "1.2" ? "cmi.core.lesson_status" : "cmi.completion_status"]).toBe(
      "incomplete",
    );
  });
  it("filters other tasks, instances and null or unsaved initial results", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", instanceUid: "frame", window: lms.launch })!;
    expect(scorm.handleTaskResult(event(null))).toBe(false);
    expect(
      scorm.handleTaskResult(event({ ...result, revision: 0, completion_status: "not_attempted" })),
    ).toBe(false);
    expect(scorm.handleTaskResult({ ...event(), task: { uid: "nested" } })).toBe(false);
    expect(
      scorm.handleTaskResult({
        ...event(),
        instanceContext: { ...event().instanceContext, instanceUid: "other" },
      }),
    ).toBe(false);
    expect(lms.setValue).not.toHaveBeenCalled();
    expect(lms.commit).not.toHaveBeenCalled();
  });
  it("deduplicates committed revisions but accepts newer failures after a pass", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    scorm.handleTaskResult(event({ ...result, revision: 3 }));
    expect(scorm.handleTaskResult(event({ ...result, revision: 2 }))).toBe(false);
    expect(scorm.handleTaskResult(event({ ...result, revision: 3 }))).toBe(false);
    expect(
      scorm.handleTaskResult(event({ ...result, revision: 4, success_status: "failed" })),
    ).toBe(true);
    expect(lms.values[version === "1.2" ? "cmi.core.lesson_status" : "cmi.success_status"]).toBe(
      "failed",
    );
    expect(lms.commit).toHaveBeenCalledTimes(2);
  });
  it("reports a rejected write and allows retrying the same revision", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    lms.setValue.mockReturnValueOnce("false");
    lms.getLastError.mockReturnValue("351");
    expect(() => scorm.handleTaskResult(event())).toThrow(ScormError);
    expect(lms.commit).not.toHaveBeenCalled();
    expect(scorm.handleTaskResult(event())).toBe(true);
  });
  it("does not acknowledge a failed commit or terminate before successful persistence", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    lms.commit.mockReturnValueOnce("false");
    expect(() => scorm.handleTaskResult(event())).toThrow(ScormError);
    expect(scorm.handleTaskResult(event())).toBe(true);
    lms.commit.mockReturnValueOnce("false");
    expect(() => scorm.finish()).toThrow(ScormError);
    expect(lms.terminate).not.toHaveBeenCalled();
    scorm.finish();
    expect(scorm.finished).toBe(true);
  });
  it("keeps bfcache sessions open and removes the pagehide handler after finish", () => {
    const lms = mockLms(version);
    const scorm = connectScorm({ taskUid: "task", window: lms.launch })!;
    lms.launch.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    expect(lms.commit).toHaveBeenCalledTimes(1);
    expect(lms.terminate).not.toHaveBeenCalled();
    lms.launch.dispatchEvent(new PageTransitionEvent("pagehide"));
    expect(scorm.finished).toBe(true);
    lms.launch.dispatchEvent(new PageTransitionEvent("pagehide"));
    expect(lms.terminate).toHaveBeenCalledTimes(1);
  });
  it("reports automatic lifecycle errors and supports explicit lifecycle management", () => {
    const lms = mockLms(version);
    const onError = vi.fn();
    connectScorm({ taskUid: "task", window: lms.launch, onError });
    lms.commit.mockReturnValue("false");
    lms.launch.dispatchEvent(new PageTransitionEvent("pagehide"));
    expect(onError).toHaveBeenCalledWith(expect.any(ScormError));
    const manual = mockLms(version);
    connectScorm({ taskUid: "task", window: manual.launch, autoFinish: false });
    manual.launch.dispatchEvent(new PageTransitionEvent("pagehide"));
    expect(manual.commit).not.toHaveBeenCalled();
  });
  it("does not install lifecycle handlers after failed initialization", () => {
    const lms = mockLms(version);
    lms.initialize.mockReturnValueOnce("false");
    expect(() => connectScorm({ taskUid: "task", window: lms.launch })).toThrow(ScormError);
    lms.launch.dispatchEvent(new PageTransitionEvent("pagehide"));
    expect(lms.commit).not.toHaveBeenCalled();
    expect(connectScorm({ taskUid: "task", window: lms.launch })).not.toBeNull();
  });
});

describe("SCORM discovery", () => {
  it("does nothing outside an LMS and rejects an incompatible requested version", () => {
    expect(connectScorm({ taskUid: "task" })).toBeNull();
    const lms = mockLms("1.2");
    expect(connectScorm({ taskUid: "task", version: "2004", window: lms.launch })).toBeNull();
    expect(lms.initialize).not.toHaveBeenCalled();
  });
  it("finds a parent API or a popup opener and tolerates cross-origin access errors", () => {
    const lms = mockLms();
    const start = { parent: lms.launch } as Window;
    expect(discoverApi(start)?.api).toBe(lms.api);
    const popup = {
      get parent() {
        throw new Error("SecurityError");
      },
      opener: lms.launch,
    } as unknown as Window;
    expect(discoverApi(popup)?.api).toBe(lms.api);
  });
  it("handles cycles, invalid APIs and inaccessible API getters", () => {
    const start = {
      API: { LMSInitialize: vi.fn() },
      get API_1484_11() {
        throw new Error("SecurityError");
      },
    } as unknown as Window;
    Object.assign(start, { parent: start, opener: start });
    expect(discoverApi(start)).toBeNull();
  });
});
