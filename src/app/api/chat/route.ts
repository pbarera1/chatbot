import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getErrorMessage } from '@/shared/error-handler';
import { getCorsHeaders } from '@/shared/cors-handler';

// CORS headers for simple use
const CORS_HEADERS: HeadersInit = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(req: Request) {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    return new Response(null, {
        status: 204,
        headers: {
            ...corsHeaders,
            ...CORS_HEADERS,
            'Access-Control-Max-Age': '86400',
        },
    });
}

export async function POST(request: Request) {
    try {
        const { messages }: { messages: UIMessage[] } = await request.json();

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: 'You are a friendly assistant!',
            messages: await convertToModelMessages(messages),
            stopWhen: stepCountIs(5),
        });

        const origin = request.headers.get('origin');
        const corsHeaders = getCorsHeaders(origin);

        return result.toUIMessageStreamResponse({
            headers: {
                ...corsHeaders,
                ...CORS_HEADERS,
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage = getErrorMessage(error);

        const origin = request.headers.get('origin');
        const corsHeaders = getCorsHeaders(origin);

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
                ...CORS_HEADERS,
            },
        });
    }
}
