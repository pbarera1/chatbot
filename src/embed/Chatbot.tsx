'use client';

import React, { useState } from 'react';
import { useAssistant } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatbotProps {
    apiUrl?: string;
    title?: string;
    placeholder?: string;
    systemPrompt?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({
    apiUrl = '/api/chat',
    title = 'Kisco HR Assistant',
    placeholder = 'Type your message...',
    systemPrompt,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { messages, input, handleInputChange, submitMessage, status, error } =
        useAssistant({
            api: apiUrl,
            body: systemPrompt ? { systemPrompt } : undefined,
            onError: (error) => {
                console.error('Chat error:', error);
            },
        });

    const isLoading = status === 'in_progress';

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (input.trim()) {
            submitMessage();
        }
    };

    return (
        <div
            className={`fixed z-50 transition-all duration-300 ease-in-out ${
                isExpanded && isOpen
                    ? 'bottom-4 left-4 right-4'
                    : 'bottom-4 right-4'
            }`}
        >
            {!isOpen ? (
                <button
                    className="flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open chat"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            ) : (
                <div
                    className={`flex flex-col h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'w-[calc(100vw-2rem)] max-w-full' : 'w-96'
                    }`}
                >
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <div className="flex items-center gap-2">
                            <button
                                className="p-1 hover:bg-blue-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                                onClick={() => setIsExpanded(!isExpanded)}
                                aria-label={
                                    isExpanded ? 'Contract chat' : 'Expand chat'
                                }
                                title={
                                    isExpanded ? 'Contract chat' : 'Expand chat'
                                }
                            >
                                {isExpanded ? (
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
                                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                                    </svg>
                                ) : (
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
                                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                                    </svg>
                                )}
                            </button>
                            <button
                                className="p-1 hover:bg-blue-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsExpanded(false);
                                }}
                                aria-label="Close chat"
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
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start">
                                    <svg
                                        className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-800">
                                            {typeof error === 'string'
                                                ? error
                                                : error?.message ||
                                                  'Unable to reach service. Please try again.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {messages.length === 0 && !error ? (
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
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                            message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-800 border border-gray-200'
                                        }`}
                                    >
                                        {message.role === 'assistant' ? (
                                            <div className="break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        // Style code blocks
                                                        code: ({
                                                            node,
                                                            inline,
                                                            className,
                                                            children,
                                                            ...props
                                                        }: any) => {
                                                            const match =
                                                                /language-(\w+)/.exec(
                                                                    className ||
                                                                        ''
                                                                );
                                                            return !inline ? (
                                                                <code
                                                                    className="block bg-gray-100 rounded p-2 overflow-x-auto text-sm text-gray-800 font-mono"
                                                                    {...props}
                                                                >
                                                                    {children}
                                                                </code>
                                                            ) : (
                                                                <code
                                                                    className="bg-gray-100 px-1 py-0.5 rounded text-sm text-gray-800 font-mono"
                                                                    {...props}
                                                                >
                                                                    {children}
                                                                </code>
                                                            );
                                                        },
                                                        // Style paragraphs
                                                        p: ({ children }) => (
                                                            <p className="mb-2 last:mb-0">
                                                                {children}
                                                            </p>
                                                        ),
                                                        // Style lists
                                                        ul: ({ children }) => (
                                                            <ul className="list-disc list-inside mb-2 space-y-1">
                                                                {children}
                                                            </ul>
                                                        ),
                                                        ol: ({ children }) => (
                                                            <ol className="list-decimal list-inside mb-2 space-y-1">
                                                                {children}
                                                            </ol>
                                                        ),
                                                        // Style links
                                                        a: ({
                                                            children,
                                                            href,
                                                        }) => (
                                                            <a
                                                                href={href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="underline text-blue-600 hover:text-blue-700"
                                                            >
                                                                {children}
                                                            </a>
                                                        ),
                                                        // Style headers
                                                        h1: ({ children }) => (
                                                            <h1 className="text-lg font-bold mb-2 mt-2 first:mt-0">
                                                                {children}
                                                            </h1>
                                                        ),
                                                        h2: ({ children }) => (
                                                            <h2 className="text-base font-bold mb-2 mt-2 first:mt-0">
                                                                {children}
                                                            </h2>
                                                        ),
                                                        h3: ({ children }) => (
                                                            <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">
                                                                {children}
                                                            </h3>
                                                        ),
                                                        // Style blockquotes
                                                        blockquote: ({
                                                            children,
                                                        }) => (
                                                            <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2">
                                                                {children}
                                                            </blockquote>
                                                        ),
                                                        // Style tables
                                                        table: ({
                                                            children,
                                                        }) => (
                                                            <div className="overflow-x-auto my-2">
                                                                <table className="min-w-full border-collapse border border-gray-300">
                                                                    {children}
                                                                </table>
                                                            </div>
                                                        ),
                                                        th: ({ children }) => (
                                                            <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold">
                                                                {children}
                                                            </th>
                                                        ),
                                                        td: ({ children }) => (
                                                            <td className="border border-gray-300 px-2 py-1">
                                                                {children}
                                                            </td>
                                                        ),
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap break-words">
                                                {message.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
                                    <div className="flex space-x-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-delay-1"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-delay-2"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200"
                    >
                        <input
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            value={input}
                            onChange={handleInputChange}
                            placeholder={placeholder}
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
            )}
        </div>
    );
};

export default Chatbot;
