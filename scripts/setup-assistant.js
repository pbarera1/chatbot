import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // Try .env as fallback
    dotenv.config();
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    console.error(
        '   Please set it in your .env.local file or export it in your shell'
    );
    process.exit(1);
}

async function setupAssistant() {
    try {
        console.log('🚀 Starting Assistant setup with RAG...\n');

        // Step 1: Upload PDF file
        const pdfPath = path.join(
            __dirname,
            '..',
            'kisco-big-2025-compressed.pdf'
        );

        if (!fs.existsSync(pdfPath)) {
            throw new Error(`PDF file not found at: ${pdfPath}`);
        }

        console.log('📄 Uploading PDF to OpenAI...');
        const file = await openai.files.create({
            file: fs.createReadStream(pdfPath),
            purpose: 'assistants',
        });
        console.log(`✅ File uploaded: ${file.id}\n`);

        // Step 2: Wait for file to be processed
        console.log('⏳ Waiting for file to be processed...');
        let fileStatus = await openai.files.retrieve(file.id);
        while (fileStatus.status !== 'processed') {
            if (fileStatus.status === 'error') {
                throw new Error('File processing failed');
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
            fileStatus = await openai.files.retrieve(file.id);
        }
        console.log('✅ File processed successfully\n');

        // Step 3: Create Assistant with the file
        console.log('🤖 Creating Assistant with knowledge retrieval...');

        // You can customize the response length limit here
        // Set maxResponseLength to desired character count (e.g., 500, 1000, 2000)
        // Set to null or empty string to remove length limit
        const maxResponseLength = process.env.MAX_RESPONSE_LENGTH
            ? parseInt(process.env.MAX_RESPONSE_LENGTH)
            : null; // Default: no limit

        let instructions =
            'You are a helpful assistant with access to a knowledge base. Use the provided documents to answer questions accurately. If the information is not in the documents, say so.';

        if (maxResponseLength && maxResponseLength > 0) {
            instructions += ` Keep your responses concise and under ${maxResponseLength} characters when possible. Be thorough but brief.`;
        }

        const assistant = await openai.beta.assistants.create({
            name: 'RAG Chatbot Assistant',
            instructions: instructions,
            model: 'gpt-4o-mini',
            tools: [{ type: 'file_search' }],
            tool_resources: {
                file_search: {
                    vector_store_ids: [],
                },
            },
        });

        // Step 4: Create vector store and add file
        console.log('📚 Creating vector store...');

        let vectorStoreId = null;

        // Debug: Check what's available in beta API
        if (process.env.DEBUG) {
            console.log(
                '   Debug - Available beta APIs:',
                Object.keys(openai.beta || {})
            );
        }

        // Check if vectorStores API is available
        if (openai.beta?.vectorStores) {
            try {
                const vectorStore = await openai.beta.vectorStores.create({
                    name: 'PDF Knowledge Base',
                    file_ids: [file.id],
                });
                vectorStoreId = vectorStore.id;

                // Step 5: Update assistant with vector store
                console.log('🔗 Attaching vector store to assistant...');
                await openai.beta.assistants.update(assistant.id, {
                    tool_resources: {
                        file_search: {
                            vector_store_ids: [vectorStore.id],
                        },
                    },
                });

                // Wait for vector store to be ready
                console.log('⏳ Waiting for vector store to be ready...');
                let vectorStoreStatus = await openai.beta.vectorStores.retrieve(
                    vectorStore.id
                );
                while (vectorStoreStatus.status !== 'completed') {
                    if (vectorStoreStatus.status === 'failed') {
                        throw new Error('Vector store creation failed');
                    }
                    console.log(`   Status: ${vectorStoreStatus.status}...`);
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    vectorStoreStatus = await openai.beta.vectorStores.retrieve(
                        vectorStore.id
                    );
                }
                console.log('✅ Vector store ready\n');
            } catch (error) {
                console.warn(
                    '⚠️  Vector stores API not available, using direct file attachment...'
                );
                console.warn(`   Error: ${error.message}\n`);
                // Fall through to alternative method
            }
        }

        // Alternative: Attach file directly to assistant (older API method)
        if (!vectorStoreId) {
            console.log('📎 Attaching file directly to assistant...');
            await openai.beta.assistants.update(assistant.id, {
                tool_resources: {
                    file_search: {
                        vector_store_ids: [],
                    },
                },
            });

            // Attach file to assistant using the older method
            // Note: This method may require the file to be attached via the assistant's file_ids
            // However, with file_search tool, files should be in vector stores
            console.log(
                '⚠️  Note: Using file_search requires vector stores. Please ensure your OpenAI account has access to this feature.'
            );
            console.log(
                '   You may need to upgrade your OpenAI plan or wait for feature availability.\n'
            );
        }

        // Step 6: Save assistant ID to config
        const configPath = path.join(__dirname, '..', 'assistant-config.json');
        const config = {
            assistantId: assistant.id,
            fileId: file.id,
            vectorStoreId: vectorStoreId || '',
            createdAt: new Date().toISOString(),
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('💾 Configuration saved to assistant-config.json\n');
        console.log('✅ Setup complete!\n');
        console.log('📋 Assistant Details:');
        console.log(`   Assistant ID: ${assistant.id}`);
        console.log(`   File ID: ${file.id}`);
        if (vectorStoreId) {
            console.log(`   Vector Store ID: ${vectorStoreId}\n`);
        } else {
            console.log(
                `   Vector Store ID: (not created - check API access)\n`
            );
        }
        console.log(
            '💡 You can now use this assistant in your chat API route.'
        );
    } catch (error) {
        console.error('❌ Error setting up assistant:', error.message);
        process.exit(1);
    }
}

setupAssistant();
