import OpenAI from 'openai';
import { getErrorMessage } from '@/shared/error-handler';

// MCP Server Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';
const MCP_BEARER_TOKEN = process.env.MCP_BEARER_TOKEN;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface MCPTool {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
    };
}

// CORS headers
const CORS_HEADERS: HeadersInit = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: {
            ...CORS_HEADERS,
            'Access-Control-Max-Age': '86400',
        },
    });
}

/**
 * Fetch available tools from MCP server
 */
async function fetchMCPTools(): Promise<MCPTool[]> {
    const requestId = Date.now();
    const jsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: requestId,
    };

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (MCP_BEARER_TOKEN) {
        headers['Authorization'] = `Bearer ${MCP_BEARER_TOKEN}`;
    }

    try {
        const response = await fetch(`${MCP_SERVER_URL}/mcp/kisco`, {
            method: 'POST',
            headers,
            body: JSON.stringify(jsonRpcRequest),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.jsonrpc === '2.0' && data.result?.tools) {
            return Array.isArray(data.result.tools) ? data.result.tools : [];
        }

        return [];
    } catch (error) {
        console.error('[MCP] Failed to fetch tools:', error);
        return [];
    }
}

/**
 * Fix schema types - convert ["string", "null"] to "string"
 */
function fixSchemaTypes(schema: any): any {
    if (!schema || typeof schema !== 'object') return schema;

    const fixed: any = {};
    for (const [key, value] of Object.entries(schema)) {
        if (key === 'type' && Array.isArray(value)) {
            fixed[key] = Array.isArray(value)
                ? value.find((t: any) => t !== 'null') || value[0] || 'string'
                : value;
        } else if (key === 'properties' && typeof value === 'object') {
            const fixedProps: any = {};
            for (const [propKey, propValue] of Object.entries(value as any)) {
                if (propValue && typeof propValue === 'object') {
                    fixedProps[propKey] = fixSchemaTypes(propValue);
                }
            }
            fixed[key] = fixedProps;
        } else if (key === 'items' && typeof value === 'object') {
            fixed[key] = fixSchemaTypes(value);
        } else if (key !== 'annotations') {
            fixed[key] = value;
        }
    }
    return fixed;
}

/**
 * Convert MCP tools to OpenAI function format
 */
function convertToOpenAIFunctions(
    mcpTools: MCPTool[]
): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return mcpTools.map((tool) => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description || `Tool: ${tool.name}`,
            parameters: fixSchemaTypes(
                tool.inputSchema || { type: 'object', properties: {} }
            ),
        },
    }));
}

/**
 * Call an MCP tool
 */
async function callMCPTool(toolName: string, arguments_: any): Promise<any> {
    const requestId = Date.now() + Math.floor(Math.random() * 1000000);
    const jsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: toolName,
            arguments: arguments_,
        },
        id: requestId,
    };

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (MCP_BEARER_TOKEN) {
        headers['Authorization'] = `Bearer ${MCP_BEARER_TOKEN}`;
    }

    const requestBody = JSON.stringify(jsonRpcRequest);
    const requestUrl = `${MCP_SERVER_URL}/mcp/kisco`;

    // Log the tool call details
    console.log(`[MCP Tool Call] ===========================================`);
    console.log(`[MCP Tool Call] Tool Name: ${toolName}`);
    console.log(`[MCP Tool Call] URL: ${requestUrl}`);
    console.log(
        `[MCP Tool Call] Arguments:`,
        JSON.stringify(arguments_, null, 2)
    );
    console.log(`[MCP Tool Call] Full Request Body:`);
    console.dir(requestBody);
    console.log(`[MCP Tool Call] Headers:`, JSON.stringify(headers, null, 2));

    const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: AbortSignal.timeout(30000),
    });

    console.log(
        `[MCP Tool Call] Response Status: ${response.status} ${response.statusText}`
    );
    console.log(
        `[MCP Tool Call] Response Headers:`,
        JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
    );

    // Read response body
    const responseText = await response.text();
    console.log(`[MCP Tool Call] Response Body (raw):`, responseText);

    if (!response.ok) {
        console.error(`[MCP Tool Call] ✗ HTTP Error: ${response.status}`);
        console.error(`[MCP Tool Call] Response Text:`, responseText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data;
    try {
        data = JSON.parse(responseText);
        console.log(
            `[MCP Tool Call] Parsed Response:`,
            JSON.stringify(data, null, 2)
        );
    } catch (parseError) {
        console.error(
            `[MCP Tool Call] ✗ Failed to parse JSON response:`,
            parseError
        );
        console.error(`[MCP Tool Call] Raw response:`, responseText);
        throw new Error(
            `Invalid JSON response from MCP server: ${responseText.substring(
                0,
                200
            )}`
        );
    }

    if (data.jsonrpc === '2.0') {
        if (data.error) {
            console.error(
                `[MCP Tool Call] ✗ JSON-RPC Error:`,
                JSON.stringify(data.error, null, 2)
            );
            throw new Error(data.error.message || JSON.stringify(data.error));
        }
        if (data.result) {
            console.log(
                `[MCP Tool Call] ✓ Success, result:`,
                JSON.stringify(data.result, null, 2)
            );
            if (data.result.content) {
                if (Array.isArray(data.result.content)) {
                    // Extract text from each content item
                    const textParts = data.result.content
                        .map((item: any) => {
                            if (
                                item &&
                                typeof item === 'object' &&
                                item.text !== undefined
                            ) {
                                // If it's an object with a text property, ensure it's a string
                                return String(item.text);
                            }
                            // If it's already a string, use it directly
                            return typeof item === 'string'
                                ? item
                                : String(item);
                        })
                        .filter((text: string) => text && text.length > 0);

                    const extractedText = textParts.join('\n');
                    console.log(
                        `[MCP Tool Call] Extracted text from content array, length: ${
                            extractedText.length
                        }, type: ${typeof extractedText}`
                    );

                    // Special handling for report: parse and log the JSON
                    if (
                        toolName.startsWith('report') &&
                        data.result.content[0]?.text
                    ) {
                        try {
                            const parsedJson = JSON.parse(
                                data.result.content[0].text
                            );
                            console.log(
                                `[MCP Tool Call] Parsed JSON from report-tool:`
                            );
                            console.dir(parsedJson);
                        } catch (parseError) {
                            console.warn(
                                `[MCP Tool Call] Failed to parse JSON from report-tool:`,
                                parseError
                            );
                        }
                    }

                    // Ensure we always return a string
                    return String(extractedText);
                }
                // If content is not an array, return it as string
                return typeof data.result.content === 'string'
                    ? data.result.content
                    : JSON.stringify(data.result.content);
            }

            // If no content field, stringify the whole result
            const finalResult =
                typeof data.result === 'string'
                    ? data.result
                    : JSON.stringify(data.result);
            console.log(
                `[MCP Tool Call] Returning result as string, length: ${finalResult.length}`
            );
            return finalResult;
        }
    }

    console.error(`[MCP Tool Call] ✗ Invalid response format`);
    throw new Error('Invalid MCP response format');
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Fetch MCP tools
        const mcpTools = await fetchMCPTools();
        const tools = convertToOpenAIFunctions(mcpTools);

        // System prompt to guide tool calling order
        const systemPrompt = `You are a reporting assistant that helps users query and visualize data.

IMPORTANT: When a user asks a question that requires data, you MUST follow this exact tool calling order:

1. FIRST: Call report-schema-tool to discover available dimensions, measures, and facts
        a. Use the "name" key not "title" when selecting a dimension or measure
2. FINALLY: Call report-query-tool with the specific measures, dimensions, and filters to retrieve the actual data. You should use "format": "recharts" under args when calling report-query-tool.

DO NOT call report-query-tool before you know which measures and dimensions to use. You must first explore the schema and get suggestions.

When you receive query results, analyze them and:
- Provide a clear explanation of the data
- If appropriate, suggest creating a visualization (chart) by indicating the chart type and data structure
- Use chart annotations when visualization would help understand the data`;

        // Convert messages to OpenAI format, adding system prompt at the start
        const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
            [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                ...messages.map((msg: any) => ({
                    role: msg.role,
                    content: msg.content,
                })),
            ];

        // Track tool calls for multi-step execution
        let currentMessages = [...openaiMessages];
        let maxIterations = 5;
        let iteration = 0;

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    while (iteration < maxIterations) {
                        iteration++;

                        // Create completion
                        const completion = await openai.chat.completions.create(
                            {
                                model: 'gpt-4o-mini',
                                messages: currentMessages,
                                tools: tools.length > 0 ? tools : undefined,
                                tool_choice:
                                    tools.length > 0 ? 'auto' : undefined,
                                stream: true,
                            }
                        );

                        let assistantMessage: any = {
                            role: 'assistant',
                            content: '',
                            tool_calls: [],
                        };
                        let hasToolCalls = false;

                        // Process stream
                        for await (const chunk of completion) {
                            const choice = chunk.choices[0];
                            if (choice?.delta) {
                                // Stream content
                                if (choice.delta.content) {
                                    const chunkText = `0:${JSON.stringify({
                                        id: `msg-${Date.now()}`,
                                        role: 'assistant',
                                        content: choice.delta.content,
                                    })}\n`;
                                    controller.enqueue(
                                        encoder.encode(chunkText)
                                    );
                                    assistantMessage.content +=
                                        choice.delta.content;
                                }

                                // Collect tool calls
                                if (choice.delta.tool_calls) {
                                    hasToolCalls = true;
                                    for (const toolCall of choice.delta
                                        .tool_calls) {
                                        const index = toolCall.index || 0;
                                        if (
                                            !assistantMessage.tool_calls[index]
                                        ) {
                                            assistantMessage.tool_calls[index] =
                                                {
                                                    id: toolCall.id,
                                                    type: 'function',
                                                    function: {
                                                        name:
                                                            toolCall.function
                                                                ?.name || '',
                                                        arguments:
                                                            toolCall.function
                                                                ?.arguments ||
                                                            '',
                                                    },
                                                };
                                        } else {
                                            assistantMessage.tool_calls[
                                                index
                                            ].function.arguments +=
                                                toolCall.function?.arguments ||
                                                '';
                                        }
                                    }
                                }
                            }

                            // Check finish reason
                            if (choice?.finish_reason) {
                                if (
                                    choice.finish_reason === 'tool_calls' &&
                                    hasToolCalls
                                ) {
                                    // Execute tool calls
                                    currentMessages.push(assistantMessage);

                                    for (const toolCall of assistantMessage.tool_calls) {
                                        // Notify UI that tool is being called
                                        // Send as annotation in a format AI SDK can handle (must be array)
                                        const toolCallStartEvent = `8:${JSON.stringify(
                                            [
                                                {
                                                    type: 'tool-call-start',
                                                    toolCallId: toolCall.id,
                                                    toolName:
                                                        toolCall.function.name,
                                                },
                                            ]
                                        )}\n`;
                                        controller.enqueue(
                                            encoder.encode(toolCallStartEvent)
                                        );

                                        try {
                                            const args = JSON.parse(
                                                toolCall.function.arguments
                                            );
                                            const result = await callMCPTool(
                                                toolCall.function.name,
                                                args
                                            );

                                            // Ensure content is a string
                                            // The result from callMCPTool is already extracted as a string from content array
                                            let toolContent: string;
                                            if (typeof result === 'string') {
                                                toolContent = result;
                                            } else if (
                                                result === null ||
                                                result === undefined
                                            ) {
                                                toolContent = '';
                                            } else {
                                                // If somehow it's still an object, stringify it
                                                toolContent =
                                                    JSON.stringify(result);
                                            }

                                            // Double-check it's actually a string
                                            toolContent = String(toolContent);

                                            console.log(
                                                `[Tool Call] ✓ Tool ${
                                                    toolCall.function.name
                                                } completed, content length: ${
                                                    toolContent.length
                                                }, type: ${typeof toolContent}, first 100 chars: ${toolContent.substring(
                                                    0,
                                                    100
                                                )}`
                                            );

                                            // Notify UI that tool call succeeded
                                            // Send as annotation in a format AI SDK can handle (must be array)
                                            const toolCallSuccessEvent = `8:${JSON.stringify(
                                                [
                                                    {
                                                        type: 'tool-call-complete',
                                                        toolCallId: toolCall.id,
                                                        toolName:
                                                            toolCall.function
                                                                .name,
                                                        success: true,
                                                    },
                                                ]
                                            )}\n`;
                                            controller.enqueue(
                                                encoder.encode(
                                                    toolCallSuccessEvent
                                                )
                                            );

                                            // If this is a report-query-tool result, check if it contains chartable data
                                            if (
                                                toolCall.function.name ===
                                                    'report-query-tool' &&
                                                toolContent
                                            ) {
                                                try {
                                                    const queryResult =
                                                        JSON.parse(toolContent);

                                                    // Check if result has data array suitable for charting
                                                    if (
                                                        queryResult.data &&
                                                        Array.isArray(
                                                            queryResult.data
                                                        ) &&
                                                        queryResult.data
                                                            .length > 0
                                                    ) {
                                                        // Send chart annotation so LLM can suggest visualization (must be array)
                                                        const chartAnnotation = `8:${JSON.stringify(
                                                            [
                                                                {
                                                                    type: 'chart-data',
                                                                    toolCallId:
                                                                        toolCall.id,
                                                                    data: queryResult.data,
                                                                    annotation:
                                                                        queryResult.annotation,
                                                                    query: queryResult.query,
                                                                },
                                                            ]
                                                        )}\n`;
                                                        controller.enqueue(
                                                            encoder.encode(
                                                                chartAnnotation
                                                            )
                                                        );
                                                    }
                                                } catch (parseError) {
                                                    // Not valid JSON or not chartable, ignore
                                                }
                                            }

                                            currentMessages.push({
                                                role: 'tool',
                                                tool_call_id: toolCall.id,
                                                content: toolContent,
                                            });
                                        } catch (error) {
                                            console.error(
                                                `[Tool Call] Error:`,
                                                error
                                            );

                                            const errorMessage =
                                                error instanceof Error
                                                    ? error.message
                                                    : String(error);

                                            // Notify UI that tool call failed
                                            // Send as annotation in a format AI SDK can handle (must be array)
                                            const toolCallErrorEvent = `8:${JSON.stringify(
                                                [
                                                    {
                                                        type: 'tool-call-complete',
                                                        toolCallId: toolCall.id,
                                                        toolName:
                                                            toolCall.function
                                                                .name,
                                                        success: false,
                                                        error: errorMessage,
                                                    },
                                                ]
                                            )}\n`;
                                            controller.enqueue(
                                                encoder.encode(
                                                    toolCallErrorEvent
                                                )
                                            );

                                            currentMessages.push({
                                                role: 'tool',
                                                tool_call_id: toolCall.id,
                                                content: `Error: ${errorMessage}`,
                                            });
                                        }
                                    }

                                    // Continue loop to get next response
                                    break;
                                } else {
                                    // Done
                                    controller.close();
                                    return;
                                }
                            }
                        }
                    }

                    controller.close();
                } catch (error) {
                    console.error('[Reporting API] Stream error:', error);
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                ...CORS_HEADERS,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Reporting API error:', error);
        const errorMessage = getErrorMessage(error);

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS,
            },
        });
    }
}
