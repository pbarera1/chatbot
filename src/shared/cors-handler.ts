/**
 * CORS header handling for cross-origin requests
 * Works in both Next.js and Azure Functions
 *
 * Note: Same-origin requests (no Origin header) are always allowed.
 * CORS restrictions only apply to cross-origin requests.
 */

/**
 * Normalize origin by removing trailing slashes
 */
function normalizeOrigin(origin: string): string {
    return origin.replace(/\/+$/, '');
}

export function getAllowedOrigin(origin: string | null): string {
    // Same-origin requests don't send an Origin header - always allow them
    // CORS only applies to cross-origin requests
    if (!origin) {
        return '*'; // Same-origin or no origin header - always allowed
    }

    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    const allowedOrigins = allowedOriginsEnv
        ? allowedOriginsEnv.split(',').map((o) => normalizeOrigin(o.trim()))
        : null;

    // If no restrictions set, allow all origins
    if (!allowedOrigins || allowedOrigins.length === 0) {
        return '*';
    }

    // Normalize the incoming origin
    const normalizedOrigin = normalizeOrigin(origin);

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(normalizedOrigin)) {
        return normalizedOrigin;
    }

    // Debug logging in development (won't appear in production)
    if (process.env.NODE_ENV === 'development') {
        console.log('CORS check:', {
            origin,
            normalizedOrigin,
            allowedOrigins,
            allowedOriginsEnv,
        });
    }

    // Origin not in allowed list - return empty string to block
    return '';
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
    const allowedOrigin = getAllowedOrigin(origin);
    
    // Don't set Access-Control-Allow-Origin if origin is blocked (empty string)
    // Browsers will reject requests with empty Access-Control-Allow-Origin header
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // 24 hours
    };
    
    // Only set Access-Control-Allow-Origin if there's a valid value
    if (allowedOrigin) {
        headers['Access-Control-Allow-Origin'] = allowedOrigin;
    }
    
    return headers;
}
