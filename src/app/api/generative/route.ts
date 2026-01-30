import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { tools as localTools } from '@/ai/tools';
import { createMCPClient } from '@ai-sdk/mcp';

// MCP Server Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL;
const MCP_BEARER_TOKEN = process.env.MCP_BEARER_TOKEN;
const MCP_ENDPOINT = MCP_SERVER_URL ? `${MCP_SERVER_URL}/mcp/kisco` : undefined;

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

async function getMCPTools() {
    try {
        if (!MCP_ENDPOINT) {
            console.warn(
                '[MCP] MCP_SERVER_URL not configured, skipping MCP tools'
            );
            return {};
        }

        // Initialize MCP client if not already created
        if (!mcpClient) {
            console.log(
                '[MCP] Initializing MCP client with SSE transport:',
                MCP_ENDPOINT
            );

            const transportConfig: any = {
                type: 'http' as const,
                url: MCP_ENDPOINT,
            };

            // Add headers if Bearer token is provided
            if (MCP_BEARER_TOKEN) {
                transportConfig.headers = {
                    Authorization: `Bearer ${MCP_BEARER_TOKEN}`,
                };
            }

            mcpClient = await createMCPClient({
                transport: transportConfig,
                onUncaughtError: (error) => {
                    console.error('[MCP] Uncaught error:', error);
                },
            });
        }

        const tools = await mcpClient.tools();
        console.log('[MCP] Loaded tools:', Object.keys(tools));
        return tools;
    } catch (error) {
        console.error('[MCP] Failed to load tools:', error);
        // Return empty object on error to allow local tools to still work
        return {};
    }
}

export async function POST(request: Request) {
    const { messages }: { messages: UIMessage[] } = await request.json();

    console.log(
        '[Generative API] Received request with',
        messages.length,
        'messages'
    );

    // Get MCP tools and merge with local tools
    const mcpTools = await getMCPTools();
    
    // Wrap MCP tools with logging
    const wrappedMCPTools = Object.entries(mcpTools).reduce((acc: any, [toolName, tool]: [string, any]) => {
        acc[toolName] = {
            ...tool,
            execute: async (...args: any[]) => {
                console.log(`[MCP Tool Execute] ${toolName} called with args:`, args);
                const startTime = Date.now();
                try {
                    const result = await tool.execute(...args);
                    const duration = Date.now() - startTime;
                    // Log full result structure for debugging
                    const resultStr = typeof result === 'object' 
                        ? JSON.stringify(result, null, 2).substring(0, 1000) 
                        : String(result);
                    console.log(`[MCP Tool Execute] ${toolName} completed in ${duration}ms`);
                    console.log(`[MCP Tool Execute] ${toolName} result:`, resultStr);
                    console.log(`[MCP Tool Execute] ${toolName} result type:`, typeof result);
                    if (typeof result === 'object' && result !== null) {
                        console.log(`[MCP Tool Execute] ${toolName} result keys:`, Object.keys(result));
                    }
                    return result;
                } catch (error) {
                    const duration = Date.now() - startTime;
                    console.error(`[MCP Tool Execute] ${toolName} failed after ${duration}ms:`, error);
                    throw error;
                }
            },
        };
        return acc;
    }, {});
    
    const allTools = {
        ...localTools,
        ...wrappedMCPTools,
    };

    console.log('[Generative API] Tools available:', Object.keys(allTools));

    // System prompt to guide tool calling order
    const systemPrompt = `You are a reporting assistant that helps users query and visualize data. Todays date is ${new Date().toLocaleDateString()}.

            IMPORTANT: When a user asks a question that requires data, you MUST follow this exact tool calling order:
            
            1. FIRST: Call report-schema-tool to discover available dimensions, measures, and facts
                a. Use the "name" key not "title" from the response of the report-schema-tool when selecting a dimension or measure. They should always be lowercase and used exactly as provided for the report-query-tool.
                b. Often a user will give you an employee or community name and you will need to find the associated id in a joined table in order to get the data.
                c. CRITICAL - Schema Exploration and Joins: When looking for ANY field, you MUST thoroughly explore the ENTIRE schema response and all joins and relationships.
                   - If a field isn't immediately visible, examine the FULL schema response structure - don't just look at top-level dimensions
                   - When the user asks for a field that seems missing, your FIRST action should be to check for available joins or relationships
                d. Do NOT assume a field doesn't exist just because it's not in the first level of dimensions - ALWAYS check joins and relationships FIRST
                e. If after thoroughly checking the schema (including all joins) you still can't find a field, you may need to ask the user for clarification or check if the field exists under a different name
            2. FINALLY: Call report-query-tool with the specific measures, dimensions, and filters to retrieve the actual data. You should use "format": "recharts" under args when calling report-query-tool.
            
            DO NOT call report-query-tool before you know which measures and dimensions to use. You must first explore the schema and get suggestions, including checking all available joins and relationships.
            
            CRITICAL - Data Display Rules:
            - When you receive structured data (arrays of objects with the same properties) from ANY tool, including report-query-tool, you MUST use the displayTable tool to render it. DO NOT format it as markdown tables in your text response.
            - If the data is suitable for visualization (time series, comparisons, distributions), use displayChart instead.
            - If the data is a simple list of records, rows, or tabular data, ALWAYS use displayTable.
            - Examples of when to use displayTable: employee lists, financial records, query results, any data with multiple rows and columns.
            - NEVER respond with markdown tables - always use the displayTable tool for better user experience.`;

    const result = streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: allTools,
        stopWhen: stepCountIs(10), // Increased to allow LLM to generate response after tool execution
        onFinish: (result) => {
            console.log('[Stream Finish] Stream completed:', {
                finishReason: result.finishReason,
                usage: result.usage,
                text: result.text?.substring(0, 200),
            });
        },
        onStepFinish: (step) => {
            // Log all step types for debugging
            console.log('[Step Finish] Step completed:', {
                stepType: 'stepType' in step ? step.stepType : 'unknown',
                hasToolCalls: 'toolCalls' in step && !!step.toolCalls,
                hasToolResults: 'toolResults' in step && !!step.toolResults,
                hasText: 'text' in step && !!step.text,
            });
            
            // Log tool calls
            if ('toolCalls' in step && step.toolCalls) {
                console.log('[MCP Tool Call] Tool invoked:', {
                    toolCalls: step.toolCalls.map((call: any) => ({
                        toolCallId: call.toolCallId,
                        toolName: call.toolName,
                        args: 'args' in call ? call.args : undefined,
                    })),
                });
            }
            // Log tool results
            if ('toolResults' in step && step.toolResults) {
                console.log('[MCP Tool Result] Tool execution completed:', {
                    results: step.toolResults.map((result: any) => ({
                        toolCallId: result.toolCallId,
                        toolName: result.toolName,
                        hasResult: 'result' in result,
                        resultType: 'result' in result ? typeof result.result : undefined,
                        resultPreview: 'result' in result 
                            ? (typeof result.result === 'object' 
                                ? JSON.stringify(result.result).substring(0, 500) 
                                : String(result.result).substring(0, 500))
                            : undefined,
                        error: 'error' in result ? result.error : undefined,
                    })),
                });
            }
        },
    });

    return result.toUIMessageStreamResponse();
}
