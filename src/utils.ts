/**
 * Normalizes a URL by removing query parameters and fragment identifier
 * @param url - The URL to normalize
 * @returns The normalized URL without query and fragment parts
 */
function normalizeUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        // Remove query parameters and fragment
        parsedUrl.search = '';
        parsedUrl.hash = '';
        return parsedUrl.toString();
    } catch (error) {
        // If URL parsing fails, return the original URL
        console.warn('Failed to parse URL:', url, error);
        return url;
    }
}

/**
 * Safely retrieves and returns the normalized URL of the current window
 * @returns The normalized current window URL or null if not available
 */
export function getCurrentNormalizedUrl(): string | null {
    try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || !window.location) {
            return null;
        }

        // Get the current URL from window.location
        const currentUrl = window.location.href;

        // Normalize the URL using the existing function
        return normalizeUrl(currentUrl);
    } catch (error) {
        console.warn('Failed to get current window URL:', error);
        return null;
    }
}
