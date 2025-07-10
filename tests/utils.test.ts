import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentNormalizedUrl } from '../src/utils.ts';

describe('utils', () => {
  // Store the original window object
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore the original window object after each test
    // Use Object.defineProperty instead of direct assignment to handle cases where window is defined with a getter
    Object.defineProperty(global, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow
    });
  });

  describe('normalizeUrl', () => {
    // Since normalizeUrl is not exported, we'll test it indirectly through getCurrentNormalizedUrl
    it('removes query parameters and fragment from URL', () => {
      // Mock window.location
      global.window = {
        location: {
          href: 'https://example.com/path?query=value#fragment'
        }
      } as any;

      const result = getCurrentNormalizedUrl();
      expect(result).toBe('https://example.com/path');
    });

    it('handles URLs with no query parameters or fragment', () => {
      // Mock window.location
      global.window = {
        location: {
          href: 'https://example.com/path'
        }
      } as any;

      const result = getCurrentNormalizedUrl();
      expect(result).toBe('https://example.com/path');
    });

    it('preserves trailing slash if present', () => {
      // Mock window.location
      global.window = {
        location: {
          href: 'https://example.com/path/?query=value#fragment'
        }
      } as any;

      const result = getCurrentNormalizedUrl();
      expect(result).toBe('https://example.com/path/');
    });

    it('returns original URL when URL parsing fails', () => {
      // Mock console.warn to verify it's called
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create an invalid URL that will cause the URL constructor to throw
      const invalidUrl = 'invalid://url:with:multiple:colons';

      // Mock window.location with the invalid URL
      global.window = {
        location: {
          href: invalidUrl
        }
      } as any;

      const result = getCurrentNormalizedUrl();

      // Verify the result is the original invalid URL
      expect(result).toBe(invalidUrl);

      // Verify console.warn was called with the expected arguments
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse URL:',
        invalidUrl,
        expect.any(Error)
      );

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getCurrentNormalizedUrl', () => {
    it('returns null when window is undefined', () => {
      // Set window to undefined
      global.window = undefined as any;

      const result = getCurrentNormalizedUrl();
      expect(result).toBeNull();
    });

    it('returns null when window.location is undefined', () => {
      // Set window.location to undefined
      global.window = {} as any;

      const result = getCurrentNormalizedUrl();
      expect(result).toBeNull();
    });

    it('handles errors gracefully', () => {
      // Mock window.location to throw an error when accessed
      Object.defineProperty(global, 'window', {
        get: () => {
          throw new Error('Test error');
        }
      });

      const result = getCurrentNormalizedUrl();
      expect(result).toBeNull();
    });

    it('returns normalized URL when window.location is available', () => {
      // Mock window.location
      global.window = {
        location: {
          href: 'https://example.com/path?query=value#fragment'
        }
      } as any;

      const result = getCurrentNormalizedUrl();
      expect(result).toBe('https://example.com/path');
    });
  });
});
