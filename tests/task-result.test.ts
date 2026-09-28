import { describe, expect, it, vi } from "vitest";

import { setOnTaskResultChangedCallback, setTaskListener } from "../src/callbacks.ts";
import { trustedMessage } from "./test-utils.ts";

describe("task result callback", () => {
  it("delivers saved and updated results, including null, through the registered listener", () => {
    const callback = vi.fn();
    setOnTaskResultChangedCallback(callback);
    setTaskListener();
    for (const taskResult of [
      null,
      {
        completion_status: "completed",
        success_status: "passed",
        score: 100,
        progress: 1,
        revision: 2,
        updated_at: null,
      },
    ]) {
      const payload = {
        instanceContext: { instanceUid: "frame" },
        task: { uid: "task" },
        taskResult,
      };
      window.dispatchEvent(
        trustedMessage({ data: { service: "pumproom", type: "onTaskResultChanged", payload } }),
      );
      expect(callback).toHaveBeenLastCalledWith(payload);
    }
    expect(callback).toHaveBeenCalledTimes(2);
  });
  it("rejects messages from an untrusted origin or unrelated window", () => {
    const callback = vi.fn();
    setOnTaskResultChangedCallback(callback);
    setTaskListener();
    const data = { service: "pumproom", type: "onTaskResultChanged", payload: {} };
    window.dispatchEvent(trustedMessage({ data, origin: "https://untrusted.example" }));
    window.dispatchEvent(trustedMessage({ data, source: window }));
    expect(callback).not.toHaveBeenCalled();
  });
});
