import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEnvironment, setEnvironmentListener, setOnInitCallback } from '../src/environment.js';
import * as version from '../src/version.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('environment helpers', () => {
  it('sends environment data to target', () => {
    vi.spyOn(version, 'getVersion').mockReturnValue('1.0.0');
    const target = { postMessage: vi.fn() } as unknown as Window;
    sendEnvironment(target, 'https://pumproom.tech');
    expect(target.postMessage).toHaveBeenCalledWith(
      {
        service: 'pumproom',
        type: 'setEnvironment',
        payload: { pageURL: window.location.href, sdkVersion: '1.0.0' }
      },
      'https://pumproom.tech'
    );
  });

  it('responds to getEnvironment message', () => {
    vi.spyOn(version, 'getVersion').mockReturnValue('2.0.0');
    const postSpy = vi.spyOn(window, 'postMessage');
    setEnvironmentListener();
    const event = new MessageEvent('message', {
      data: { service: 'pumproom', type: 'getEnvironment' },
      origin: 'https://pumproom.tech',
      source: window
    });
    window.dispatchEvent(event);

    expect(postSpy).toHaveBeenCalledWith(
      {
        service: 'pumproom',
        type: 'setEnvironment',
        payload: { pageURL: window.location.href, sdkVersion: '2.0.0' }
      },
      'https://pumproom.tech'
    );
  });

  it('executes synchronous onInitCallback when getEnvironment message is received', () => {
    // Create a mock instance context
    const mockInstanceContext = {
      instanceUid: 'test-instance-uid',
      repoName: 'test-repo',
      taskName: 'test-task',
      realm: 'test-realm',
      tags: 'test-tags'
    };

    // Create a mock callback
    const mockCallback = vi.fn();

    // Set the callback
    setOnInitCallback(mockCallback);

    // Set up the environment listener
    setEnvironmentListener();

    // Create and dispatch a getEnvironment message event with the mock instance context
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'getEnvironment',
        payload: mockInstanceContext
      },
      origin: 'https://pumproom.tech',
      source: window
    });
    window.dispatchEvent(event);

    // Verify the callback was called with the correct instance context
    expect(mockCallback).toHaveBeenCalledWith(mockInstanceContext);
  });

  it('executes asynchronous onInitCallback when getEnvironment message is received', async () => {
    // Create a mock instance context
    const mockInstanceContext = {
      instanceUid: 'async-test-instance-uid',
      repoName: 'async-test-repo',
      taskName: 'async-test-task',
      realm: 'async-test-realm',
      tags: 'async-test-tags'
    };

    // Create a mock async callback that returns a promise
    const mockAsyncCallback = vi.fn().mockImplementation(async (context) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return context;
    });

    // Set the async callback
    setOnInitCallback(mockAsyncCallback);

    // Set up the environment listener
    setEnvironmentListener();

    // Create and dispatch a getEnvironment message event with the mock instance context
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'getEnvironment',
        payload: mockInstanceContext
      },
      origin: 'https://pumproom.tech',
      source: window
    });
    window.dispatchEvent(event);

    // Verify the callback was called with the correct instance context
    expect(mockAsyncCallback).toHaveBeenCalledWith(mockInstanceContext);

    // Wait for any pending promises to resolve
    await new Promise(resolve => setTimeout(resolve, 20));

    // Verify the callback was called exactly once
    expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
  });
});
