# Embeddable React OpenAI Chatbot

A modern, embeddable chatbot built with React, Next.js, AI SDK, and Tailwind CSS. This chatbot can be embedded on any website as a single script file.

## Features

-   OpenAI GPT-4 Turbo via AI SDK
-   Embeddable as a single script file
-   Real-time streaming responses
-   Markdown rendering support (code blocks, lists, tables, etc.)
-   RAG (Retrieval Augmented Generation) with PDF knowledge base
-   Local Dev with Next.js for the API route

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your OpenAI API key and Assistant ID:

```
OPENAI_API_KEY=your_openai_api_key_here
ASSISTANT_ID=asst_your_assistant_id_here
```

3. **Set up RAG with PDF (Optional but recommended):**

    Place your PDF file in the project root (e.g., `kisco-big-2025-compressed.pdf`) and run:

    ```bash
    npm run setup:assistant
    ```

    This will:

    - Upload the PDF to OpenAI's file storage
    - Create a vector store with the PDF content
    - Create an Assistant with knowledge retrieval enabled
    - Save the configuration to `assistant-config.json` (for reference)

    **Important:** After running the setup, copy the `assistantId` from `assistant-config.json` and add it to your `.env.local` file as `ASSISTANT_ID=asst_...`

    The chatbot will use the assistant specified in `ASSISTANT_ID` for RAG-enabled conversations.

4. Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the chatbot in action.

## Building

### Build Next.js App

```bash
npm run build
```

### Build Embeddable Script

```bash
npm run build:embed
```

This creates a single embeddable script at `dist/embed/chatbot.iife.js` that can be included on any website.

## Embedding on Another Site

### Option 1: Simple Embed (Auto-initialize)

The script automatically loads the required CSS file from the same directory. Just include the script tag:

```html
<script
    src="https://your-domain.com/chatbot.iife.js"
    data-api-url="https://your-api-domain.com/api/chat"
    data-title="Chat Assistant"
    data-placeholder="Type your message..."
></script>
```

**Note:** Make sure both `chatbot.iife.js` and `style.css` are served from the same directory. The script will automatically inject the CSS when it loads.

### Option 2: Manual Initialization

```html
<!-- CSS is automatically loaded, but you can also include it manually -->
<link rel="stylesheet" href="https://your-domain.com/style.css" />
<script src="https://your-domain.com/chatbot.iife.js"></script>
<script>
    window.initChatbot({
        apiUrl: 'https://your-api-domain.com/api/chat',
        title: 'Chat Assistant',
        placeholder: 'Type your message...',
        systemPrompt: 'You are a helpful assistant.',
        containerId: 'chatbot-root', // optional, defaults to 'chatbot-root'
    });
</script>
```

## API Route

The chatbot expects a POST endpoint at `/api/chat` that accepts:

```json
{
    "messages": [{ "role": "user", "content": "Hello!" }]
}
```

And returns a streaming response compatible with the AI SDK format.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts    # Next.js API route
│   │   ├── page.tsx              # Demo page
│   │   ├── layout.tsx            # Next.js layout
│   │   └── globals.css           # Global styles
│   └── embed/
│       ├── Chatbot.tsx           # Main chatbot component
│       ├── index.tsx             # Embed entry point
│       └── embed.css             # Embed styles
├── dist/embed/                   # Built embeddable script
└── package.json
```

## Customization

The chatbot component accepts the following props:

-   `apiUrl`: API endpoint URL (default: "/api/chat")
-   `title`: Chat window title (default: "Chat Assistant")
-   `placeholder`: Input placeholder text (default: "Type your message...")
-   `systemPrompt`: System prompt for the AI (optional)

## Potential Costs

Initial Embedding Cost
Vector DB Hosting (Monthly)
Query (each chat completion)

To reduce query cost could do an api call with the text embedding and summarize it, then use the smaller summary embedding to minimze the token count

## TODO

-   store chat in session storage to persist hard refreshs, new page loads
-   move api route to azure
    -   add auth
-   updating RAG from sharepoint, and keeping those files small
