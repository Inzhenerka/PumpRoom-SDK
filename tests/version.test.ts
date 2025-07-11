import { describe, it, expect } from 'vitest';
import { getVersion } from '../src/version.ts';
import pkg from '../package.json';

describe('version', () => {
  it('returns package version', () => {
    expect(getVersion()).toBe(pkg.version);
  });
});
