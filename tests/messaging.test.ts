import { describe, it, expect, vi } from 'vitest';
import { getPumpRoomEventMessage } from '../src/messaging.js';

describe('messaging', () => {
  it('validates message structure', () => {
    // Valid message
    const validEvent = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'toggleFullscreen', payload: { fullscreenState: true } },
    });

    // Invalid messages
    const noDataEvent = new MessageEvent('message', {});
    const nonObjectDataEvent = new MessageEvent('message', { data: 'not an object' });
    const wrongServiceEvent = new MessageEvent('message', {
      data: { service: 'other', type: 'toggleFullscreen' },
    });
    const noTypeEvent = new MessageEvent('message', {
      data: { service: 'pumproom' },
    });
    const nonStringTypeEvent = new MessageEvent('message', {
      data: { service: 'pumproom', type: 123 },
    });

    // Test with a specific target type
    expect(getPumpRoomEventMessage(validEvent, 'toggleFullscreen')).toEqual({
      service: 'pumproom',
      type: 'toggleFullscreen',
      payload: { fullscreenState: true }
    });

    // Test invalid messages
    expect(getPumpRoomEventMessage(noDataEvent, 'toggleFullscreen')).toBeNull();
    expect(getPumpRoomEventMessage(nonObjectDataEvent, 'toggleFullscreen')).toBeNull();
    expect(getPumpRoomEventMessage(wrongServiceEvent, 'toggleFullscreen')).toBeNull();
    expect(getPumpRoomEventMessage(noTypeEvent, 'toggleFullscreen')).toBeNull();
    expect(getPumpRoomEventMessage(nonStringTypeEvent, 'toggleFullscreen')).toBeNull();
  });

  it('returns typed messages based on target_type', () => {
    const toggleFullscreenEvent = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'toggleFullscreen', payload: { fullscreenState: true } },
    });
    const setPumpRoomUserEvent = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'setPumpRoomUser', payload: { uid: '1', token: 't', is_admin: false } },
    });

    const toggleFullscreenMessage = getPumpRoomEventMessage(toggleFullscreenEvent, 'toggleFullscreen');
    const setPumpRoomUserMessage = getPumpRoomEventMessage(setPumpRoomUserEvent, 'setPumpRoomUser');

    expect(toggleFullscreenMessage).toEqual({ 
      service: 'pumproom', 
      type: 'toggleFullscreen', 
      payload: { fullscreenState: true } 
    });
    expect(setPumpRoomUserMessage).toEqual({ 
      service: 'pumproom', 
      type: 'setPumpRoomUser', 
      payload: { uid: '1', token: 't', is_admin: false } 
    });

    // Should return null for messages of different type than requested
    expect(getPumpRoomEventMessage(toggleFullscreenEvent, 'setPumpRoomUser')).toBeNull();
    expect(getPumpRoomEventMessage(setPumpRoomUserEvent, 'toggleFullscreen')).toBeNull();
  });
});
