/**
 * Version module for PumpRoom SDK
 * 
 * This module provides access to the SDK version information,
 * which is injected during the build process from package.json.
 * 
 * @module Version
 */

/** 
 * Version string injected by the build system
 * @internal 
 */
declare const __VERSION__: string;

/**
 * Returns the current SDK version
 * 
 * This function provides access to the SDK version defined in package.json,
 * which is injected into the build by the build system.
 * 
 * @returns The SDK version string
 * @example
 * ```typescript
 * import { getVersion } from 'pumproom-sdk';
 * 
 * console.log(`PumpRoom SDK version: ${getVersion()}`);
 * ```
 */
export function getVersion(): string {
    return __VERSION__;
}
