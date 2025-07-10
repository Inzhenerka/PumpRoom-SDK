/**
 * Instance management module for PumpRoom SDK
 *
 * This module handles instance registration and management for PumpRoom,
 * providing functions to register, retrieve, and manage instance contexts.
 *
 * @module Instance
 */
import {registerTaskInstance as registerInstanceGlobal, getTaskInstances as getInstancesGlobal} from './globals.ts';
import type {InstanceContext} from './types/index.ts';

/**
 * Registers an instance context
 *
 * @param instanceContext - The instance context to register
 * @internal
 *
 * @example
 * ```typescript
 * registerInstance({ instanceUid: '1', repoName: 'repo', taskName: 'task', realm: 'test', tags: undefined });
 * ```
 */
export function registerTaskInstance(instanceContext: InstanceContext): void {
    registerInstanceGlobal(instanceContext);
}

/**
 * Gets all registered instances
 *
 * @returns A record mapping instance UIDs to their contexts
 * @category Tasks
 * @public
 * @example
 * ```typescript
 * const instances = getInstances();
 * console.log(Object.keys(instances));
 * ```
 */
export function getTaskInstances(): Record<string, InstanceContext> {
    return getInstancesGlobal();
}
