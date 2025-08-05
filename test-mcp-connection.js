import { query } from "@anthropic-ai/claude-code";
import dotenv from 'dotenv';

dotenv.config();

async function testMCPConnection() {
    console.log("🔍 Testing Playwright MCP Connection...\n");
    
    try {
        const messages = [];
        
        // Very simple test - just try to check if MCP tools are available
        const prompt = `Please check if the Playwright MCP tools are available. 
Just list the available mcp__playwright tools without trying to use them.
Don't navigate anywhere, just tell me what Playwright MCP tools you can see.`;
        
        console.log("Sending query to Claude...\n");
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 1,
                // Try different MCP configuration approach
                allowedTools: ["mcp__playwright__browser_navigate"],
                system_prompt: "You have access to Playwright MCP tools. Just list what tools are available."
            }
        })) {
            messages.push(message);
            
            if (message.type === 'assistant' && message.message?.content) {
                console.log("Claude's response:");
                if (Array.isArray(message.message.content)) {
                    message.message.content.forEach(item => {
                        if (item.text) console.log(item.text);
                    });
                } else {
                    console.log(message.message.content);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testMCPConnection();