import { query } from "@anthropic-ai/claude-code";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugMCPResponse() {
    console.log("🔍 Debug MCP Response\n");
    
    const prompt = `Use the Playwright MCP tools to:
1. Navigate to https://www.google.com with browser_navigate
2. Take a snapshot with browser_snapshot
3. Generate a simple Page Object Model class in a typescript code block
4. Close the browser with browser_close

Use these exact tool names:
- mcp__playwright__browser_navigate
- mcp__playwright__browser_snapshot  
- mcp__playwright__browser_close

After getting the snapshot, create a TypeScript Page Object Model with this exact format:

\`\`\`typescript
// Your Page Object Model code here
\`\`\``;

    try {
        const messages = [];
        let responseCount = 0;
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 5,
                allowedTools: [
                    "mcp__playwright__browser_navigate",
                    "mcp__playwright__browser_snapshot",
                    "mcp__playwright__browser_close"
                ],
                mcp_config: JSON.stringify({
                    mcpServers: {
                        playwright: {
                            command: "npx",
                            args: ["@playwright/mcp@latest", "--headless"]
                        }
                    }
                })
            }
        })) {
            messages.push(message);
            responseCount++;
            
            console.log(`\n--- Response ${responseCount} ---`);
            console.log("Type:", message.type);
            
            if (message.type === 'assistant' && message.message?.content) {
                const content = message.message.content;
                
                if (Array.isArray(content)) {
                    console.log("Content is array with", content.length, "items");
                    
                    for (let i = 0; i < content.length; i++) {
                        const item = content[i];
                        console.log(`\nItem ${i}:`);
                        console.log("  Type:", item.type);
                        
                        if (item.type === 'tool_use') {
                            console.log("  Tool:", item.name);
                            console.log("  Input:", JSON.stringify(item.input).substring(0, 100) + "...");
                        } else if (item.type === 'text' && item.text) {
                            console.log("  Text length:", item.text.length);
                            console.log("  Text preview:", item.text.substring(0, 200) + "...");
                            
                            // Save full text for inspection
                            const filename = `debug-response-${responseCount}-${i}.txt`;
                            await fs.writeFile(path.join(__dirname, filename), item.text);
                            console.log(`  Full text saved to: ${filename}`);
                            
                            // Check if it contains code blocks
                            if (item.text.includes('```typescript')) {
                                console.log("  ✅ Contains TypeScript code block!");
                            }
                        }
                    }
                } else {
                    console.log("Content type:", typeof content);
                }
            }
        }
        
        console.log("\n✅ Debug complete!");
        console.log(`Total responses: ${responseCount}`);
        
    } catch (error) {
        console.error("\n❌ Error:", error);
    }
}

debugMCPResponse();