import Chatbot from "@/embed/Chatbot";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Chatbot Demo
        </h1>
        <p className="text-gray-600 mb-8">
          This is a demo page for the embeddable chatbot. The chatbot appears
          as a floating button in the bottom right corner.
        </p>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Click the chat button in the bottom right to open the chatbot</li>
            <li>Type a message and press send to start a conversation</li>
            <li>The chatbot uses the AI SDK with OpenAI GPT-4 Turbo</li>
            <li>Run <code className="bg-gray-100 px-2 py-1 rounded">npm run build:embed</code> to build the embeddable script</li>
          </ul>
        </div>
      </div>
      <Chatbot />
    </main>
  );
}






