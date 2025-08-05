import { query } from "@anthropic-ai/claude-code";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDebug() {
    console.log("🔍 Debug Test Starting...\n");
    
    // Check API key
    console.log("✓ API Key configured:", !!process.env.ANTHROPIC_API_KEY);
    console.log("✓ API Key starts with:", process.env.ANTHROPIC_API_KEY?.substring(0, 10) + "...");
    
    console.log("\n📡 Testing basic Claude connection...");
    
    try {
        const messages = [];
        
        // Simple test without MCP
        for await (const message of query({
            prompt: "Just say 'Hello, I'm connected!' to confirm the connection works.",
            options: {
                maxTurns: 1
            }
        })) {
            messages.push(message);
            console.log("Message type:", message.type);
            
            if (message.type === 'assistant' && message.message?.content) {
                console.log("✅ Claude says:", message.message.content);
            }
        }
        
        console.log("\n✨ Basic connection test successful!");
        
    } catch (error) {
        console.error("\n❌ Connection test failed!");
        console.error("Error details:", error.message);
        
        if (error.message.includes('401')) {
            console.error("\n🔑 This looks like an authentication issue. Please check your API key.");
        }
    }
}

testDebug();