'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { ChartRenderer } from '@/embed/ChartRenderer';

export function GenerativeUIChat() {
    const [input, setInput] = useState('');
    const { messages, sendMessage, isLoading } = useChat({
        api: '/api/generative',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="h-[600px] overflow-y-auto mb-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-center">
                            Start a conversation by typing a message below.
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
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                <div className="text-sm font-semibold mb-1">
                                    {message.role === 'user' ? 'You' : 'Assistant'}
                                </div>
                                <div>
                                    {message.parts?.map((part: any, index: number) => {
                                        // Debug: log all parts to see what we're getting
                                        if (process.env.NODE_ENV === 'development') {
                                            console.log('[Generative UI] Part:', part.type, part.state || 'no state');
                                        }
                                        
                                        // Handle text parts
                                        if (part.type === 'text') {
                                            return (
                                                <div key={index} className="whitespace-pre-wrap">
                                                    {part.text}
                                                </div>
                                            );
                                        }

                                        // Handle chart tool calls - AI SDK v6 Generative UI format
                                        if (part.type === 'tool-displayChart') {
                                            switch (part.state) {
                                                case 'input-available':
                                                    return (
                                                        <div key={index} className="text-gray-500 mt-2">
                                                            Loading chart...
                                                        </div>
                                                    );
                                                case 'output-available':
                                                    return (
                                                        <div key={index} className="mt-2">
                                                            <ChartRenderer
                                                                data={part.output.data || []}
                                                                annotation={part.output.annotation}
                                                                query={part.output.query}
                                                            />
                                                        </div>
                                                    );
                                                case 'output-error':
                                                    return (
                                                        <div key={index} className="text-red-600 mt-2">
                                                            Error: {part.errorText}
                                                        </div>
                                                    );
                                                default:
                                                    return null;
                                            }
                                        }

                                        return null;
                                    }) || (
                                        // Fallback if parts is undefined or empty
                                        message.content && (
                                            <div className="whitespace-pre-wrap">{message.content}</div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={isLoading || !input.trim()}
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
    );
}

