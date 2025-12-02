import { AssistantResponse } from 'ai';
import { getErrorMessage } from '@/shared/error-handler';
import { AssistantService } from '@/shared/assistant-service';

// Initialize assistant service (assuming this setup is correct)
const assistantService = new AssistantService();

// --- Configuration ---
// Note: Ensure your .env file uses ALLOWED_ORIGIN (singular) to match this
// For example: ALLOWED_ORIGIN="https://kisco.kiscosl.com"
const FIXED_ALLOWED_ORIGIN =
    process.env.ALLOWED_ORIGIN || 'https://kisco.kiscosl.com';

// Define the common CORS headers for both OPTIONS and POST responses
const CORS_HEADERS: HeadersInit = {
    'Access-Control-Allow-Origin': FIXED_ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    // Allow credentials if the client is sending cookies/auth headers
    'Access-Control-Allow-Credentials': 'true',
};

// Get assistant ID from environment
function getAssistantId(): string {
    const assistantId = process.env.ASSISTANT_ID;
    if (!assistantId) {
        // Log the environment error but let the try/catch handle the response
        console.error(
            'ASSISTANT_ID environment variable is not set. Using fallback error.'
        );
        throw new Error('ASSISTANT_ID environment variable is not set.');
    }
    return assistantId;
}

// --- 1. Handle preflight OPTIONS request ---
// This request MUST succeed and include the CORS headers.
// Note: Next.js App Router requires the Request parameter for route handlers
export async function OPTIONS(req: Request) {
    // Immediately return 204 with CORS headers - don't do any auth checks
    return new Response(null, {
        status: 204, // No content response for a successful preflight
        headers: {
            ...CORS_HEADERS,
            // Add Max-Age for caching the preflight result
            'Access-Control-Max-Age': '86400', // Cache for 24 hours
        },
    });
}

// --- 2. Handle POST request ---
export async function POST(req: Request) {
    try {
        const assistantId = getAssistantId();
        await assistantService.verifyAssistant(assistantId);

        const input: { threadId: string | null; message: string } =
            await req.json();

        const threadId = await assistantService.getOrCreateThread(
            input.threadId
        );

        // Use AssistantResponse to handle the chat streaming
        const response = await AssistantResponse(
            { threadId, messageId: `msg_${Date.now()}` },
            async ({ forwardStream }) => {
                await assistantService.addUserMessage(threadId, input.message);
                const run = assistantService.createStreamingRun(
                    threadId,
                    assistantId
                );
                await forwardStream(run);
            }
        );

        // Create a new Headers object from the AssistantResponse's headers
        const headers = new Headers(response.headers);

        // Merge the standard CORS headers into the response headers
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            headers.set(key, value as string);
        });

        return new Response(response.body, {
            status: response.status,
            headers: headers,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage = getErrorMessage(error);

        // Ensure CORS headers are included even on failure responses
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS,
            },
        });
    }
}
