/**
 * Instance management module for PumpRoom SDK
 *
 * This module handles instance registration and management for PumpRoom,
 * providing functions to register, retrieve, and manage instance contexts.
 *
 * @module Instance
 */
import type {InstanceContext} from './types.ts';

/**
 * State for storing registered instances
 * Maps instanceUid to InstanceContext
 * @internal
 */
const instanceRegistry: Record<string, InstanceContext> = {};

/**
 * Registers an instance context
 * 
 * @param instanceContext - The instance context to register
 * @internal
 */
export function registerInstance(instanceContext: InstanceContext): void {
    if (instanceContext && instanceContext.instanceUid) {
        instanceRegistry[instanceContext.instanceUid] = instanceContext;
    }
}

/**
 * Gets all registered instances
 * 
 * @returns A record mapping instance UIDs to their contexts
 */
export function getInstances(): Record<string, InstanceContext> {
    return {...instanceRegistry};
}
