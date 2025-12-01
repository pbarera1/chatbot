import { AssistantResponse } from 'ai';
import { getErrorMessage } from '@/shared/error-handler';
import { AssistantService } from '@/shared/assistant-service';

// Initialize assistant service
const assistantService = new AssistantService();

// Get assistant ID from environment
function getAssistantId(): string {
    const assistantId = process.env.ASSISTANT_ID;
    if (!assistantId) {
        throw new Error(
            'ASSISTANT_ID environment variable is not set. Please set it in your .env.local file.'
        );
    }
    return assistantId;
}

// Handle preflight OPTIONS request - CORS handled by vercel.json
export async function OPTIONS() {
    return new Response(null, { status: 204 });
}

export async function POST(req: Request) {
    try {
        const assistantId = getAssistantId();

        // Verify assistant is accessible
        await assistantService.verifyAssistant(assistantId);

        const input: { threadId: string | null; message: string } =
            await req.json();

        // Get or create thread using shared service
        const threadId = await assistantService.getOrCreateThread(
            input.threadId
        );

        // Use AssistantResponse helper which handles the useAssistant request format
        const response = await AssistantResponse(
            { threadId, messageId: `msg_${Date.now()}` },
            async ({ forwardStream }) => {
                // Add user message to thread using shared service
                await assistantService.addUserMessage(threadId, input.message);

                // Create and stream the run using shared service
                const run = assistantService.createStreamingRun(
                    threadId,
                    assistantId
                );

                // Forward the stream to the client
                await forwardStream(run);
            }
        );

        // CORS handled by vercel.json
        return response;
    } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage = getErrorMessage(error);
        // CORS handled by vercel.json
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
