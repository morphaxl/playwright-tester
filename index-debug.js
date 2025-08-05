import { query } from "@anthropic-ai/claude-code";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugGeneration() {
    console.log("🔍 Debug Mode - Generating Page Object Model\n");
    
    const prompt = `I need you to create a Playwright Page Object Model for a website.

URL: https://www.example.com
Page Name: Example
Description: Example.com homepage - a simple page for testing

Please generate:

1. A complete TypeScript Page Object Model class
2. A sample test file

Use TypeScript code blocks with triple backticks and the word "typescript" after them.

For example.com, include the heading, paragraphs, and any links.`;

    try {
        const messages = [];
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 2
            }
        })) {
            messages.push(message);
            
            if (message.type === 'assistant' && message.message?.content) {
                console.log("\n📝 Assistant Response:");
                console.log("Content type:", typeof message.message.content);
                console.log("Is array:", Array.isArray(message.message.content));
                
                // Log the raw content structure
                if (Array.isArray(message.message.content)) {
                    console.log("Content array length:", message.message.content.length);
                    message.message.content.forEach((item, index) => {
                        console.log(`Item ${index}:`, item.type);
                        if (item.text) {
                            console.log("Text preview:", item.text.substring(0, 200) + "...");
                            
                            // Save the full text for inspection
                            const debugPath = path.join(__dirname, `debug-response-${index}.txt`);
                            fs.writeFile(debugPath, item.text);
                            console.log(`Full text saved to: ${debugPath}`);
                        }
                    });
                }
            }
        }
        
        console.log("\n✅ Debug complete!");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

debugGeneration();