import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setOnInitCallback,
  setOnTaskLoadedCallback,
  setOnTaskSubmittedCallback,
  setOnResultReadyCallback,
  executeOnInitCallback,
  handleTaskLoadedMessage,
  handleTaskSubmittedMessage,
  handleResultReadyMessage,
} from '../src/callbacks.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('callbacks module', () => {
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

    // Directly execute the callback using the internal helper
    executeOnInitCallback(mockInstanceContext);

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

    // Simulate the execution of the callback
    executeOnInitCallback(mockInstanceContext);

    // Verify the callback was called with the correct instance context
    expect(mockAsyncCallback).toHaveBeenCalledWith(mockInstanceContext);

    // Wait for any pending promises to resolve
    await new Promise(resolve => setTimeout(resolve, 20));

    // Verify the callback was called exactly once
    expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
  });

  it('executes synchronous onTaskLoadedCallback when onTaskLoaded message is received', () => {
    // Create a mock instance context and task
    const mockInstanceContext = {
      instanceUid: 'test-instance-uid',
      repoName: 'test-repo',
      taskName: 'test-task',
      realm: 'test-realm',
      tags: 'test-tags'
    };

    const mockTask = {
      uid: 'test-task-uid',
      description: 'Test task description'
    };

    // Create a mock callback
    const mockCallback = vi.fn();

    // Set the callback
    setOnTaskLoadedCallback(mockCallback);

    // Create and dispatch a onTaskLoaded message event with the mock instance context and task
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'onTaskLoaded',
        payload: {
          instanceContext: mockInstanceContext,
          task: mockTask
        }
      },
      origin: 'https://pumproom.tech',
      source: window
    });

    // Simulate handling the message
    handleTaskLoadedMessage(event);

    // Verify the callback was called with the correct payload
    expect(mockCallback).toHaveBeenCalledWith({
      instanceContext: mockInstanceContext,
      task: mockTask
    });
  });

  it('executes asynchronous onTaskLoadedCallback when onTaskLoaded message is received', async () => {
    // Create a mock instance context and task
    const mockInstanceContext = {
      instanceUid: 'async-test-instance-uid',
      repoName: 'async-test-repo',
      taskName: 'async-test-task',
      realm: 'async-test-realm',
      tags: 'async-test-tags'
    };

    const mockTask = {
      uid: 'async-test-task-uid',
      description: 'Async test task description'
    };

    // Create a mock async callback that returns a promise
    const mockAsyncCallback = vi.fn().mockImplementation(async (payload) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return payload;
    });

    // Set the async callback
    setOnTaskLoadedCallback(mockAsyncCallback);

    // Create and dispatch a onTaskLoaded message event with the mock instance context and task
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'onTaskLoaded',
        payload: {
          instanceContext: mockInstanceContext,
          task: mockTask
        }
      },
      origin: 'https://pumproom.tech',
      source: window
    });

    // Simulate handling the message
    handleTaskLoadedMessage(event);

    // Verify the callback was called with the correct payload
    expect(mockAsyncCallback).toHaveBeenCalledWith({
      instanceContext: mockInstanceContext,
      task: mockTask
    });

    // Wait for any pending promises to resolve
    await new Promise(resolve => setTimeout(resolve, 20));

    // Verify the callback was called exactly once
    expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
  });

  it('executes synchronous onTaskSubmittedCallback when onTaskSubmitted message is received', () => {
    // Create a mock instance context and task
    const mockInstanceContext = {
      instanceUid: 'test-instance-uid',
      repoName: 'test-repo',
      taskName: 'test-task',
      realm: 'test-realm',
      tags: 'test-tags'
    };

    const mockTask = {
      uid: 'test-task-uid',
      description: 'Test task description'
    };

    // Create a mock callback
    const mockCallback = vi.fn();

    // Set the callback
    setOnTaskSubmittedCallback(mockCallback);

    // Create and dispatch a onTaskSubmitted message event with the mock instance context and task
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'onTaskSubmitted',
        payload: {
          instanceContext: mockInstanceContext,
          task: mockTask
        }
      },
      origin: 'https://pumproom.tech',
      source: window
    });

    // Simulate handling the message
    handleTaskSubmittedMessage(event);

    // Verify the callback was called with the correct payload
    expect(mockCallback).toHaveBeenCalledWith({
      instanceContext: mockInstanceContext,
      task: mockTask
    });
  });

  it('executes asynchronous onTaskSubmittedCallback when onTaskSubmitted message is received', async () => {
    // Create a mock instance context and task
    const mockInstanceContext = {
      instanceUid: 'async-test-instance-uid',
      repoName: 'async-test-repo',
      taskName: 'async-test-task',
      realm: 'async-test-realm',
      tags: 'async-test-tags'
    };

    const mockTask = {
      uid: 'async-test-task-uid',
      description: 'Async test task description'
    };

    // Create a mock async callback that returns a promise
    const mockAsyncCallback = vi.fn().mockImplementation(async (payload) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return payload;
    });

    // Set the async callback
    setOnTaskSubmittedCallback(mockAsyncCallback);

    // Create and dispatch a onTaskSubmitted message event with the mock instance context and task
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'onTaskSubmitted',
        payload: {
          instanceContext: mockInstanceContext,
          task: mockTask
        }
      },
      origin: 'https://pumproom.tech',
      source: window
    });

    // Simulate handling the message
    handleTaskSubmittedMessage(event);

    // Verify the callback was called with the correct payload
    expect(mockAsyncCallback).toHaveBeenCalledWith({
      instanceContext: mockInstanceContext,
      task: mockTask
    });

    // Wait for any pending promises to resolve
    await new Promise(resolve => setTimeout(resolve, 20));

    // Verify the callback was called exactly once
    expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
  });

  it('executes synchronous onResultReadyCallback when onResultReady message is received', () => {
    // Create a mock instance context and result
    const mockInstanceContext = {
      instanceUid: 'test-instance-uid',
      repoName: 'test-repo',
      taskName: 'test-task',
      realm: 'test-realm',
      tags: 'test-tags'
    };

    const mockResult = {
      taskUid: 'test-task-uid',
      submissionUid: 'test-submission-uid',
      status: 'success',
      message: 'Test completed successfully',
      stdout: 'Test output'
    };

    // Create a mock callback
    const mockCallback = vi.fn();

    // Set the callback
    setOnResultReadyCallback(mockCallback);

    // Create and dispatch a onResultReady message event with the mock instance context and result
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'onResultReady',
        payload: {
          instanceContext: mockInstanceContext,
          result: mockResult
        }
      },
      origin: 'https://pumproom.tech',
      source: window
    });

    // Simulate handling the message
    handleResultReadyMessage(event);

    // Verify the callback was called with the correct payload
    expect(mockCallback).toHaveBeenCalledWith({
      instanceContext: mockInstanceContext,
      result: mockResult
    });
  });

  it('executes asynchronous onResultReadyCallback when onResultReady message is received', async () => {
    // Create a mock instance context and result
    const mockInstanceContext = {
      instanceUid: 'async-test-instance-uid',
      repoName: 'async-test-repo',
      taskName: 'async-test-task',
      realm: 'async-test-realm',
      tags: 'async-test-tags'
    };

    const mockResult = {
      taskUid: 'async-test-task-uid',
      submissionUid: 'async-test-submission-uid',
      status: 'success',
      message: 'Async test completed successfully',
      stdout: 'Async test output'
    };

    // Create a mock async callback that returns a promise
    const mockAsyncCallback = vi.fn().mockImplementation(async (payload) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return payload;
    });

    // Set the async callback
    setOnResultReadyCallback(mockAsyncCallback);

    // Create and dispatch a onResultReady message event with the mock instance context and result
    const event = new MessageEvent('message', {
      data: { 
        service: 'pumproom', 
        type: 'onResultReady',
        payload: {
          instanceContext: mockInstanceContext,
          result: mockResult
        }
      },
      origin: 'https://pumproom.tech',
      source: window
    });

    // Simulate handling the message
    handleResultReadyMessage(event);

    // Verify the callback was called with the correct payload
    expect(mockAsyncCallback).toHaveBeenCalledWith({
      instanceContext: mockInstanceContext,
      result: mockResult
    });

    // Wait for any pending promises to resolve
    await new Promise(resolve => setTimeout(resolve, 20));

    // Verify the callback was called exactly once
    expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
  });
});
