# Azure Function for Chat API

This is an Azure Functions version of the chat API route, adapted to work with Azure Serverless Functions.

**Note:** This function uses **TypeScript** and imports shared core logic directly from `src/shared/*.ts` files, maintaining consistency with the Next.js implementation. Both implementations share the same business logic, error handling, and configuration loading.

## TypeScript Setup

This Azure Function uses TypeScript, which gets compiled to JavaScript before deployment. The compiled output goes to the `dist/` directory.

## Setup

1. **Install Azure Functions Core Tools** (if not already installed):
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. **Install dependencies**:
   ```bash
   cd azure-function-chat
   npm install
   ```
   
   This will install TypeScript and the necessary type definitions.

3. **Configure Environment Variables**:
   
   In Azure Portal, go to your Function App → Configuration → Application Settings, and add:
   
   - `OPENAI_API_KEY` - Your OpenAI API key (required)
   - `ASSISTANT_ID` - Your OpenAI Assistant ID (required)
   - `ALLOWED_ORIGINS` (optional) - Comma-separated list of allowed origins for CORS
   
   Or create a `local.settings.json` file for local development:
   ```json
   {
     "Values": {
       "OPENAI_API_KEY": "your-key-here",
       "ASSISTANT_ID": "asst_...",
       "ALLOWED_ORIGINS": "*"
     }
   }
   ```
   
   **Note:** The `ASSISTANT_ID` environment variable is required. The function no longer reads from `assistant-config.json`.

4. **Build the TypeScript code**:
   ```bash
   npm run build
   ```
   This compiles `index.ts` to `dist/index.js`.

5. **Deploy the function**:
   ```bash
   func azure functionapp publish <your-function-app-name>
   ```
   
   **Note:** Make sure to deploy the `dist/` directory contents, not the source `.ts` files.

## Configuration

The function uses environment variables for configuration:

- `OPENAI_API_KEY` (required) - Your OpenAI API key
- `ASSISTANT_ID` (required) - Your OpenAI Assistant ID
- `ALLOWED_ORIGINS` (optional) - Comma-separated list of allowed origins for CORS

Set these in Azure Portal → Function App → Configuration → Application Settings, or in `local.settings.json` for local development.

## Differences from Next.js Version

1. **Function Signature**: Uses Azure Functions `context` and `request` objects
2. **Streaming**: Manual stream handling instead of `AssistantResponse` helper (Azure Functions doesn't support the AI SDK's `AssistantResponse` directly)
3. **File System**: Uses Azure Functions file system paths
4. **Response**: Uses Azure Functions response format
5. **TypeScript**: Uses TypeScript with compilation to CommonJS (Next.js uses ES modules)

## Testing Locally

```bash
func start
```

The function will be available at: `http://localhost:7071/api/chat`

## Notes

- The function uses Azure Functions v4 programming model
- **TypeScript**: Source code is in `index.ts`, compiled to `dist/index.js`
- Streaming responses are handled manually to work with Azure Functions
- CORS is configured the same way as the Next.js version
- Make sure to set the function timeout appropriately in Azure (streaming can take time)
- The function imports shared TypeScript modules from `../src/shared/*.ts` which get compiled together

