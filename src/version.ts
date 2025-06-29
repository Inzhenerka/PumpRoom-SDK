import pkg from '../package.json';

/**
 * Returns SDK version defined in package.json.
 */
export function getVersion(): string {
    return pkg.version as string;
}
