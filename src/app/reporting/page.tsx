import Chatbot from '@/embed/Chatbot';
import { ChartRenderer } from '@/embed/ChartRenderer';

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

export default function Reporting() {
    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Reporting Chatbot
                </h1>
                <p className="text-gray-600 mb-8">
                    This chatbot uses OpenAI Chat Completions with MCP server
                    tools integrated directly.
                </p>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Features</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>
                            Uses OpenAI Chat Completions API (not Assistants
                            API)
                        </li>
                        <li>MCP tools fetched and integrated automatically</li>
                        <li>Simple code - AI SDK handles tool calling</li>
                        <li>Same UI as the main chatbot</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Example Activity Counts
                    </h2>
                    <ChartRenderer data={data} />
                </div>
            </div>
            <Chatbot
                apiUrl="/api/reporting"
                title="Reporting Assistant"
                placeholder="Ask about reports or data..."
                useChatMode={true}
            />
        </main>
    );
}
