import OpenAI from 'openai';

/**
 * Core assistant service that handles OpenAI Assistant API interactions
 * Framework-agnostic - can be used by Next.js or Azure Functions
 */
export class AssistantService {
    private openai: OpenAI;

    constructor(apiKey?: string) {
        this.openai = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Get or create a thread
     */
    async getOrCreateThread(threadId: string | null): Promise<string> {
        if (threadId) {
            return threadId;
        }
        const thread = await this.openai.beta.threads.create();
        return thread.id;
    }

    /**
     * Add a user message to a thread
     */
    async addUserMessage(threadId: string, message: string): Promise<void> {
        await this.openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message,
        });
    }

    /**
     * Create and return a streaming run
     */
    createStreamingRun(threadId: string, assistantId: string) {
        return this.openai.beta.threads.runs.createAndStream(threadId, {
            assistant_id: assistantId,
        });
    }

    /**
     * Verify assistant exists and is accessible
     */
    async verifyAssistant(assistantId: string): Promise<void> {
        try {
            await this.openai.beta.assistants.retrieve(assistantId);
        } catch (error: any) {
            throw new Error(
                `Assistant ${assistantId} not found or not accessible: ${error.message}`
            );
        }
    }
}
