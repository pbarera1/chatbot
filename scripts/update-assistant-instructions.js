import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
}

async function updateAssistantInstructions() {
    try {
        // Load assistant config
        const configPath = path.join(__dirname, '..', 'assistant-config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error(
                'Assistant not configured. Please run: npm run setup:assistant'
            );
        }
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        if (!config.assistantId) {
            throw new Error('Assistant ID not found in config');
        }

        // Get max response length from environment variable or prompt
        const maxResponseLength = process.env.MAX_RESPONSE_LENGTH
            ? parseInt(process.env.MAX_RESPONSE_LENGTH)
            : null;

        // Build instructions
        let instructions =
            'You are a helpful assistant with access to a knowledge base. Use the provided documents to answer questions accurately. If the information is not in the documents, say so.';

        if (maxResponseLength && maxResponseLength > 0) {
            instructions += ` Keep your responses concise and under ${maxResponseLength} characters when possible. Be thorough but brief.`;
            console.log(
                `📝 Setting response length limit to ${maxResponseLength} characters`
            );
        } else {
            console.log('📝 No response length limit set');
        }

        // Update the assistant
        console.log('🔄 Updating assistant instructions...');
        const assistant = await openai.beta.assistants.update(config.assistantId, {
            instructions: instructions,
        });

        console.log('✅ Assistant instructions updated successfully!');
        console.log(`   Assistant ID: ${assistant.id}`);
        console.log(`   Instructions length: ${instructions.length} characters`);
    } catch (error) {
        console.error('❌ Error updating assistant:', error.message);
        process.exit(1);
    }
}

updateAssistantInstructions();

