/**
 * CORS header handling for cross-origin requests
 * Works in both Next.js and Azure Functions
 */

export function getAllowedOrigin(origin: string | null): string {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : null;

    if (allowedOrigins && origin && allowedOrigins.includes(origin)) {
        return origin;
    }

    // In development or if no restrictions set, allow all
    return allowedOrigins ? '' : '*';
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': getAllowedOrigin(origin),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // 24 hours
    };
}
