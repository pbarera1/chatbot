'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { Weather } from '@/components/Weather';
import { ChartRenderer } from '@/embed/ChartRenderer';
import { TableRenderer } from '@/embed/TableRenderer';

const data = [
    {
        activityType: 'Outgoing Phone Call',
        count: 14363,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Incoming Phone Call',
        count: 3849,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Outbound Email',
        count: 2553,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Committed Face Appointment',
        count: 1952,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Letter',
        count: 1638,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Inbound Email',
        count: 1571,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Text Message Conversation',
        count: 1259,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Committed Phone Appointment',
        count: 508,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Unscheduled Walk-In',
        count: 279,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Task',
        count: 144,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Outgoing Text Message',
        count: 59,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Incoming Text Message',
        count: 42,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Outbound Text Message',
        count: 14,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Draft Email',
        count: 3,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Event Attendence',
        count: 3,
        user: 'Mike Jacobs',
    },
];

export default function Page() {
    const [input, setInput] = useState('');
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/generative',
        }),
    });

    // Debug: log messages to see structure
    console.log('[Generative Page] Messages:', messages);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage({ text: input });
        setInput('');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Generative UI Chat
                </h1>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="h-[600px] overflow-y-auto mb-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 text-center">
                                    Start a conversation by typing a message
                                    below.
                                </p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${
                                        message.role === 'user'
                                            ? 'justify-end'
                                            : 'justify-start'
                                    }`}
                                >
                                    <div
                                        className={`w-full max-w-[80%] rounded-lg px-4 py-3 ${
                                            message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        <div className="text-xs font-semibold mb-1 opacity-75 uppercase tracking-wide">
                                            {message.role === 'user'
                                                ? 'You'
                                                : 'Assistant'}
                                        </div>
                                        <div className="space-y-2">
                                            {message.parts?.map(
                                                (part: any, index: number) => {
                                                    // Debug logging
                                                    console.log(
                                                        '[Generative UI] Part:',
                                                        part.type,
                                                        part.state
                                                    );

                                                    if (part.type === 'text') {
                                                        return (
                                                            <div
                                                                key={index}
                                                                className="whitespace-pre-wrap break-words"
                                                            >
                                                                {part.text}
                                                            </div>
                                                        );
                                                    }

                                                    if (
                                                        part.type ===
                                                        'tool-displayWeather'
                                                    ) {
                                                        switch (part.state) {
                                                            case 'input-available':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-center gap-2 text-gray-500"
                                                                    >
                                                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                                        <span>
                                                                            Loading
                                                                            weather...
                                                                        </span>
                                                                    </div>
                                                                );
                                                            case 'output-available':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="mt-2"
                                                                    >
                                                                        <Weather
                                                                            {...(part.output as {
                                                                                weather: string;
                                                                                temperature: number;
                                                                                location: string;
                                                                            })}
                                                                        />
                                                                    </div>
                                                                );
                                                            case 'output-error':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded"
                                                                    >
                                                                        Error:{' '}
                                                                        {
                                                                            part.errorText
                                                                        }
                                                                    </div>
                                                                );
                                                            default:
                                                                return null;
                                                        }
                                                    }

                                                    if (
                                                        part.type ===
                                                        'tool-displayChart'
                                                    ) {
                                                        switch (part.state) {
                                                            case 'input-available':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-center gap-2 text-gray-500"
                                                                    >
                                                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                                        <span>
                                                                            Loading
                                                                            chart...
                                                                        </span>
                                                                    </div>
                                                                );
                                                            case 'output-available':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="mt-2"
                                                                    >
                                                                        <ChartRenderer
                                                                            data={
                                                                                part
                                                                                    .output
                                                                                    .data ||
                                                                                []
                                                                            }
                                                                            annotation={
                                                                                part
                                                                                    .output
                                                                                    .annotation
                                                                            }
                                                                            query={
                                                                                part
                                                                                    .output
                                                                                    .query
                                                                            }
                                                                            title={
                                                                                part
                                                                                    .output
                                                                                    .title
                                                                            }
                                                                            chartType={
                                                                                part
                                                                                    .output
                                                                                    .chartType
                                                                            }
                                                                        />
                                                                    </div>
                                                                );
                                                            case 'output-error':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded"
                                                                    >
                                                                        Error:{' '}
                                                                        {
                                                                            part.errorText
                                                                        }
                                                                    </div>
                                                                );
                                                            default:
                                                                return null;
                                                        }
                                                    }

                                                    if (
                                                        part.type ===
                                                        'tool-displayTable'
                                                    ) {
                                                        switch (part.state) {
                                                            case 'input-available':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-center gap-2 text-gray-500"
                                                                    >
                                                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                                        <span>
                                                                            Loading
                                                                            table...
                                                                        </span>
                                                                    </div>
                                                                );
                                                            case 'output-available':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="mt-2"
                                                                    >
                                                                        <TableRenderer
                                                                            data={
                                                                                part
                                                                                    .output
                                                                                    .data ||
                                                                                []
                                                                            }
                                                                            columns={
                                                                                part
                                                                                    .output
                                                                                    .columns
                                                                            }
                                                                            title={
                                                                                part
                                                                                    .output
                                                                                    .title
                                                                            }
                                                                        />
                                                                    </div>
                                                                );
                                                            case 'output-error':
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded"
                                                                    >
                                                                        Error:{' '}
                                                                        {
                                                                            part.errorText
                                                                        }
                                                                    </div>
                                                                );
                                                            default:
                                                                return null;
                                                        }
                                                    }

                                                    return null;
                                                }
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2"
                    >
                        <input
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={
                                status === 'streaming' || status === 'submitted'
                            }
                        />
                        <button
                            type="submit"
                            className="flex items-center justify-center w-12 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={
                                !input.trim() ||
                                status === 'streaming' ||
                                status === 'submitted'
                            }
                            aria-label="Send message"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
