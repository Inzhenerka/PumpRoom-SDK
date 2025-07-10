import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerTaskInstance, getTaskInstances } from '../src/instance.ts';
import { setEnvironmentListener } from '../src/environment.ts';
import type { InstanceContext } from '../src/types/index.ts';

// Since we can't directly access the private instanceRegistry, we'll use
// a different approach for testing. We'll create a fresh test for each case
// and avoid dependencies between tests.

beforeEach(() => {
  // Reset all mocks before each test
  vi.restoreAllMocks();
});

describe('instance module', () => {
  it('registers an instance context', () => {
    // Create a test instance
    const instanceContext: InstanceContext = {
      instanceUid: 'test-instance-123',
      repoName: 'test-repo',
      taskName: 'test-task',
      realm: 'test-realm',
      tags: 'test-tags'
    };

    // Register the instance
    registerTaskInstance(instanceContext);

    // Get all instances and verify our instance is included
    const instances = getTaskInstances();
    expect(instances).toHaveProperty('test-instance-123');
    expect(instances['test-instance-123']).toEqual(instanceContext);
  });

  it('does not register instance without instanceUid', () => {
    // Create an invalid instance without instanceUid
    const invalidInstance = {
      repoName: 'test-repo',
      taskName: 'test-task',
      realm: 'test-realm',
      tags: 'test-tags'
    } as InstanceContext;

    // Get the current instances to check the count before
    const beforeInstances = getTaskInstances();
    const beforeCount = Object.keys(beforeInstances).length;

    // Try to register the invalid instance
    registerTaskInstance(invalidInstance);

    // Get instances again and verify no new instance was added
    const afterInstances = getTaskInstances();
    const afterCount = Object.keys(afterInstances).length;
    expect(afterCount).toBe(beforeCount);
  });

  it('returns a copy of the registry', () => {
    // Create and register a test instance
    const instanceContext: InstanceContext = {
      instanceUid: 'copy-test-instance',
      repoName: 'test-repo',
      taskName: 'test-task',
      realm: 'test-realm',
      tags: 'test-tags'
    };

    registerTaskInstance(instanceContext);

    // Get instances and modify the returned object
    const instances = getTaskInstances();
    instances['copy-test-instance'] = {
      ...instanceContext,
      repoName: 'modified-repo'
    };

    // Get instances again and verify the original wasn't modified
    const newInstances = getTaskInstances();
    expect(newInstances['copy-test-instance'].repoName).toBe('test-repo');
  });

  it('can register multiple instances', () => {
    // Create two test instances with different UIDs
    const instance1: InstanceContext = {
      instanceUid: 'multi-test-1',
      repoName: 'repo-1',
      taskName: 'task-1',
      realm: 'realm-1',
      tags: 'tags-1'
    };

    const instance2: InstanceContext = {
      instanceUid: 'multi-test-2',
      repoName: 'repo-2',
      taskName: 'task-2',
      realm: 'realm-2',
      tags: 'tags-2'
    };

    // Get current instances to check the count before
    const beforeInstances = getTaskInstances();
    const beforeCount = Object.keys(beforeInstances).length;

    // Register both instances
    registerTaskInstance(instance1);
    registerTaskInstance(instance2);

    // Get instances again and verify both were added
    const afterInstances = getTaskInstances();
    expect(afterInstances).toHaveProperty('multi-test-1');
    expect(afterInstances).toHaveProperty('multi-test-2');
    expect(Object.keys(afterInstances).length).toBe(beforeCount + 2);
    expect(afterInstances['multi-test-1']).toEqual(instance1);
    expect(afterInstances['multi-test-2']).toEqual(instance2);
  });

  it('works with environment module integration', () => {
    // Set up the environment listener
    setEnvironmentListener();

    // Create a test instance context
    const instanceContext = {
      instanceUid: 'env-test-instance',
      repoName: 'env-test-repo',
      taskName: 'env-test-task',
      realm: 'env-test-realm',
      tags: 'env-test-tags'
    };

    // Create and dispatch a getEnvironment message event
    const event = new MessageEvent('message', {
      data: {
        service: 'pumproom',
        type: 'getEnvironment',
        payload: { instanceContext }
      },
      origin: 'https://pumproom.tech',
      source: window
    });

    window.dispatchEvent(event);

    // Verify the instance was registered through the environment module
    const instances = getTaskInstances();
    expect(instances).toHaveProperty('env-test-instance');
    expect(instances['env-test-instance']).toEqual(instanceContext);
  });
});
