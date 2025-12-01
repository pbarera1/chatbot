const { app } = require('@azure/functions');
const { Readable } = require('stream');

// Import shared modules from src/shared (CommonJS versions for Azure Functions)
const { getAssistantConfig } = require('../src/shared/config-loader.js');
const { getErrorMessage } = require('../src/shared/error-handler.js');
const { getCorsHeaders } = require('../src/shared/cors-handler.js');
const { AssistantService } = require('../src/shared/assistant-service.js');

// Initialize assistant service
const assistantService = new AssistantService();

// Convert OpenAI stream to readable stream for Azure Functions
function createStreamFromRun(run) {
    const encoder = new TextEncoder();
    let accumulatedText = '';
    let messageId = `msg_${Date.now()}`;
    let runCompleted = false;

    const readable = new Readable({
        async read() {
            try {
                for await (const event of run) {
                    if (event.event === 'thread.message.delta') {
                        const delta = event.data.delta;
                        if (delta.content && Array.isArray(delta.content)) {
                            for (const contentItem of delta.content) {
                                if (
                                    contentItem.type === 'text' &&
                                    contentItem.text
                                ) {
                                    const textValue = contentItem.text.value;
                                    if (textValue != null) {
                                        const textStr =
                                            typeof textValue === 'string'
                                                ? textValue
                                                : String(textValue);
                                        if (textStr !== '') {
                                            accumulatedText += textStr;
                                            const chunk = {
                                                id: messageId,
                                                role: 'assistant',
                                                content: textStr,
                                            };
                                            const encodedChunk = `0:${JSON.stringify(
                                                chunk
                                            )}\n`;
                                            this.push(
                                                Buffer.from(encodedChunk)
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    } else if (event.event === 'thread.message.completed') {
                        const message = event.data;
                        if (message.content[0]?.type === 'text') {
                            const fullText = message.content[0].text.value;
                            if (accumulatedText !== fullText) {
                                const finalChunk = {
                                    id: messageId,
                                    role: 'assistant',
                                    content: fullText.slice(
                                        accumulatedText.length
                                    ),
                                };
                                this.push(
                                    Buffer.from(
                                        `0:${JSON.stringify(finalChunk)}\n`
                                    )
                                );
                                accumulatedText = fullText;
                            }
                        }
                    } else if (event.event === 'thread.run.completed') {
                        runCompleted = true;
                        this.push(Buffer.from(`d:{"finishReason":"stop"}\n`));
                        this.push(null); // End stream
                        return;
                    } else if (event.event === 'thread.run.failed') {
                        const errorData = event.data;
                        let errorMessage =
                            'Unable to reach service. Please try again.';
                        if (errorData.last_error) {
                            const errorCode = String(
                                errorData.last_error.code || ''
                            );
                            const errorMsg = errorData.last_error.message || '';

                            if (
                                errorCode === 'rate_limit_exceeded' ||
                                errorMsg.includes('rate limit')
                            ) {
                                errorMessage =
                                    'Unable to reach service. Please try again in a moment.';
                            } else if (
                                errorMsg.includes('quota') ||
                                errorCode.includes('quota')
                            ) {
                                errorMessage =
                                    'Service temporarily unavailable. Please check your account billing.';
                            } else {
                                errorMessage = errorMsg || errorMessage;
                            }
                        }
                        this.push(
                            Buffer.from(
                                `e:${JSON.stringify({ error: errorMessage })}\n`
                            )
                        );
                        this.push(null);
                        return;
                    }
                }

                if (!runCompleted) {
                    this.push(Buffer.from(`d:{"finishReason":"stop"}\n`));
                    this.push(null);
                }
            } catch (error) {
                const errorMessage = getErrorMessage(error);
                this.push(
                    Buffer.from(
                        `e:${JSON.stringify({ error: errorMessage })}\n`
                    )
                );
                this.push(null);
            }
        },
    });

    return readable;
}

app.http('chat', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const origin = request.headers.get('origin');
        const corsHeaders = getCorsHeaders(origin);

        // Handle OPTIONS preflight
        if (request.method === 'OPTIONS') {
            return {
                status: 204,
                headers: corsHeaders,
            };
        }

        try {
            const config = getAssistantConfig();

            // Verify assistant is accessible
            await assistantService.verifyAssistant(config.assistantId);

            const input = await request.json();

            // Get or create thread using shared service
            const threadId = await assistantService.getOrCreateThread(
                input.threadId
            );

            // Add user message to thread using shared service
            await assistantService.addUserMessage(threadId, input.message);

            // Create and stream the run using shared service
            const run = assistantService.createStreamingRun(
                threadId,
                config.assistantId
            );

            // Create readable stream from OpenAI run
            const stream = createStreamFromRun(run);

            // Return streaming response
            return {
                status: 200,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                    ...corsHeaders,
                },
                body: stream,
            };
        } catch (error) {
            context.log.error('Chat API error:', error);
            const errorMessage = getErrorMessage(error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
                body: JSON.stringify({ error: errorMessage }),
            };
        }
    },
});
