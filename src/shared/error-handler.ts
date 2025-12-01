/**
 * Extract user-friendly error messages from OpenAI errors
 * Works consistently across Next.js and Azure Functions
 */
export function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'status' in error) {
        const openaiError = error as any;

        // Handle rate limit errors
        if (
            openaiError.status === 429 ||
            openaiError.code === 'rate_limit_exceeded'
        ) {
            return 'Unable to reach service. Please try again in a moment.';
        }

        // Handle quota exceeded errors
        if (
            openaiError.code === 'insufficient_quota' ||
            (openaiError.message && openaiError.message.includes('quota'))
        ) {
            return 'Service temporarily unavailable. Please check your account billing.';
        }

        // Handle authentication errors
        if (
            openaiError.status === 401 ||
            openaiError.code === 'invalid_api_key'
        ) {
            return 'Unable to reach service. Please check your API configuration.';
        }

        // Handle other API errors
        if (openaiError.message) {
            return `Unable to reach service: ${openaiError.message}`;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Unable to reach service. Please try again later.';
}

