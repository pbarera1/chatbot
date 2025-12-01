# Shared Core Modules

This directory contains shared business logic used by both the Next.js API route and Azure Functions implementation.

## Modules

-   **`error-handler.ts/js`** - Extracts user-friendly error messages from OpenAI errors
-   **`cors-handler.ts/js`** - Handles CORS headers for cross-origin requests
-   **`assistant-service.ts/js`** - Core OpenAI Assistant API service (thread management, message handling, streaming)

**Note:** Configuration is now handled directly via `ASSISTANT_ID` environment variable. The `config-loader` module is no longer used.

## Usage

### Next.js (TypeScript)

```typescript
import { AssistantService } from '@/shared/assistant-service';

// Get assistant ID from environment
const assistantId = process.env.ASSISTANT_ID;
```

### Azure Functions (TypeScript)

```typescript
import { AssistantService } from '../src/shared/assistant-service';

// Get assistant ID from environment
const assistantId = process.env.ASSISTANT_ID;
```

## File Structure

-   `.ts` files - TypeScript versions (used by both Next.js and Azure Functions)
-   `.js` files - CommonJS versions (kept for backward compatibility, but TypeScript is preferred)

**Current Setup:**

-   **Next.js** uses the `.ts` files directly with ES modules
-   **Azure Functions** uses TypeScript (compiles `.ts` to `.js` in `dist/` folder)

Both implementations now use the same TypeScript source files, ensuring consistency and type safety.

## Maintenance

When updating shared logic:

1. **Update the `.ts` files** - Both Next.js and Azure Functions use these
2. The `.js` files are kept for backward compatibility but are not actively maintained
3. Test both Next.js and Azure Functions implementations
4. Run `npm run build` in `azure-function-chat/` to compile TypeScript changes

## Benefits

-   **Single source of truth** - Business logic is centralized
-   **Consistency** - Both implementations behave identically
-   **Easier maintenance** - Fix bugs in one place
-   **Better testing** - Test core logic independently
