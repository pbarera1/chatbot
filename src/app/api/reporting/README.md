# Reporting Chatbot API

This API route provides a chatbot interface using OpenAI's **Assistants API** with MCP (Model Context Protocol) tools configured through the OpenAI dashboard.

## Setup (Much Simpler!)

Instead of manually wiring up MCP tools, configure everything in OpenAI's dashboard:

### 1. Create Assistant in OpenAI Dashboard

1. Go to [OpenAI Platform](https://platform.openai.com/assistants)
2. Click "Create" to create a new assistant
3. Give it a name like "Reporting Assistant"

### 2. Add MCP Server as a Tool

1. In the assistant configuration, find the "Tools" section
2. Click "Add" → Select "MCP Server"
3. Click "Add new" and configure:
   - **Server URL:** `http://localhost:3001/mcp/kisco` (your MCP server URL)
   - **Label:** "Kisco MCP Server" (or any label)
   - **Authentication:** 
     - Method: "Bearer Token"
     - Token: Your `MCP_BEARER_TOKEN` value

4. Set "Approval" to "Never" (or "Always" if you want to approve each tool call)
5. Click "Add" to save

### 3. Configure Environment Variable

Add to your `.env.local`:

```bash
REPORTING_ASSISTANT_ID=asst_your_assistant_id_here
```

The assistant ID will be visible in the OpenAI dashboard after creation (starts with `asst_`).

## Benefits of This Approach

✅ **No manual code** - OpenAI handles all MCP communication  
✅ **Same pattern** - Uses same Assistants API as your main chat  
✅ **Dashboard configuration** - Easy to add/remove tools  
✅ **Automatic handling** - OpenAI manages tool discovery and calling  
✅ **Less code to maintain** - ~80 lines instead of 475+ lines!

## Usage

Visit `/reporting` to use the chatbot. The assistant will automatically:
- Discover tools from your MCP server
- Call tools when needed
- Handle all JSON-RPC communication
- Return results seamlessly

## Adding More MCP Servers

Simply add more MCP Server tools in the OpenAI dashboard - no code changes needed!
