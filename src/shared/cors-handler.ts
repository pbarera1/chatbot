/**
 * CORS header handling for cross-origin requests
 * Works in both Next.js and Azure Functions
 *
 * Note: Same-origin requests (no Origin header) are always allowed.
 * CORS restrictions only apply to cross-origin requests.
 */

export function getAllowedOrigin(origin: string | null): string {
    // Same-origin requests don't send an Origin header - always allow them
    // CORS only applies to cross-origin requests
    if (!origin) {
        return '*'; // Same-origin or no origin header - always allowed
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : null;

    // If no restrictions set, allow all origins
    if (!allowedOrigins) {
        return '*';
    }

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
        return origin;
    }

    // Origin not in allowed list - return empty string to block
    return '';
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': getAllowedOrigin(origin),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // 24 hours
    };
}
