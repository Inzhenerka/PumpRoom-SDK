import { describe, expect, it } from "vitest";

import { getPumpRoomEventMessage } from "../src/messaging.ts";
import { trustedMessage } from "./test-utils.ts";

describe("messaging", () => {
  it("validates message structure", () => {
    // Valid message
    const validEvent = trustedMessage({
      data: { service: "pumproom", type: "toggleFullscreen", payload: { fullscreenState: true } },
    });

    // Invalid messages
    const noDataEvent = trustedMessage({});
    const nonObjectDataEvent = trustedMessage({ data: "not an object" });
    const wrongServiceEvent = trustedMessage({
      data: { service: "other", type: "toggleFullscreen" },
    });
    const noTypeEvent = trustedMessage({
      data: { service: "pumproom" },
    });
    const nonStringTypeEvent = trustedMessage({
      data: { service: "pumproom", type: 123 },
    });

    // Test with a specific target type
    expect(getPumpRoomEventMessage(validEvent, "toggleFullscreen")).toEqual({
      service: "pumproom",
      type: "toggleFullscreen",
      payload: { fullscreenState: true },
    });

    // Test invalid messages
    expect(getPumpRoomEventMessage(noDataEvent, "toggleFullscreen")).toBeNull();
    expect(getPumpRoomEventMessage(nonObjectDataEvent, "toggleFullscreen")).toBeNull();
    expect(getPumpRoomEventMessage(wrongServiceEvent, "toggleFullscreen")).toBeNull();
    expect(getPumpRoomEventMessage(noTypeEvent, "toggleFullscreen")).toBeNull();
    expect(getPumpRoomEventMessage(nonStringTypeEvent, "toggleFullscreen")).toBeNull();
  });

  it("returns typed messages based on target_type", () => {
    const toggleFullscreenEvent = trustedMessage({
      data: { service: "pumproom", type: "toggleFullscreen", payload: { fullscreenState: true } },
    });
    const setPumpRoomUserEvent = trustedMessage({
      data: {
        service: "pumproom",
        type: "setPumpRoomUser",
        payload: { uid: "1", token: "t", is_admin: false },
      },
    });

    const toggleFullscreenMessage = getPumpRoomEventMessage(
      toggleFullscreenEvent,
      "toggleFullscreen",
    );
    const setPumpRoomUserMessage = getPumpRoomEventMessage(setPumpRoomUserEvent, "setPumpRoomUser");

    expect(toggleFullscreenMessage).toEqual({
      service: "pumproom",
      type: "toggleFullscreen",
      payload: { fullscreenState: true },
    });
    expect(setPumpRoomUserMessage).toEqual({
      service: "pumproom",
      type: "setPumpRoomUser",
      payload: { uid: "1", token: "t", is_admin: false },
    });

    // Should return null for messages of different type than requested
    expect(getPumpRoomEventMessage(toggleFullscreenEvent, "setPumpRoomUser")).toBeNull();
    expect(getPumpRoomEventMessage(setPumpRoomUserEvent, "toggleFullscreen")).toBeNull();
  });
});
