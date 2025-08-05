import { query } from "@anthropic-ai/claude-code";

async function testBasicSDKIntegration() {
    console.log("Testing basic Claude Code SDK integration with Playwright MCP...\n");
    
    const messages = [];
    
    try {
        // Simple test to verify SDK connection
        for await (const message of query({
            prompt: "Can you check if the Playwright MCP server is available? Just respond with yes or no.",
            options: {
                maxTurns: 1,
                allowedTools: ["mcp__playwright__browser_navigate", "mcp__playwright__browser_snapshot"]
            }
        })) {
            messages.push(message);
            
            if (message.type === 'assistant' && message.message?.content) {
                console.log("Assistant response:", message.message.content);
            }
        }
        
        console.log("\n✅ Basic SDK integration test successful!");
        
    } catch (error) {
        console.error("❌ SDK integration test failed:", error);
    }
}

// Run the test
testBasicSDKIntegration();