import { query } from "@anthropic-ai/claude-code";
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function simpleTest() {
    console.log("🚀 Simple Page Analysis Test\n");
    
    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error("❌ No API key found! Please add ANTHROPIC_API_KEY to your .env file");
        return;
    }
    
    console.log("✓ API key loaded");
    console.log("\n📡 Connecting to Claude...\n");
    
    const messages = [];
    
    // Simpler prompt without MCP first
    const prompt = `
Please analyze the website at https://www.example.com and tell me:
1. What type of page it is
2. What elements you would expect to find there
3. What a Page Object Model for this page might include

You don't need to actually visit the page, just describe what you know about example.com.
`;

    try {
        let messageCount = 0;
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 2
            }
        })) {
            messageCount++;
            console.log(`📨 Received message ${messageCount} of type: ${message.type}`);
            
            if (message.type === 'assistant' && message.message?.content) {
                console.log("\n🤖 Claude's response:");
                console.log(message.message.content);
            }
            
            if (message.type === 'result') {
                console.log("\n📊 Result:", message);
            }
        }
        
        console.log("\n✅ Test completed successfully!");
        
    } catch (error) {
        console.error("\n❌ Error occurred:");
        console.error("Type:", error.constructor.name);
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
    }
}

simpleTest();