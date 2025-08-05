import { query } from "@anthropic-ai/claude-code";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse markdown file to extract test configuration
 */
async function parseMarkdownConfig(mdFilePath) {
    const content = await fs.readFile(mdFilePath, 'utf-8');
    
    const config = {
        url: '',
        pageName: '',
        description: ''
    };
    
    const urlMatch = content.match(/url:\s*(.+)/i);
    if (urlMatch) config.url = urlMatch[1].trim();
    
    const pageNameMatch = content.match(/page[_\s]?name:\s*(.+)/i);
    if (pageNameMatch) config.pageName = pageNameMatch[1].trim();
    
    const descMatch = content.match(/description:\s*(.+)/i);
    if (descMatch) config.description = descMatch[1].trim();
    
    return config;
}

/**
 * Generate Page Object Model using Playwright MCP
 */
async function generatePageObjectModelWithMCP(config) {
    console.log("\n🚀 Starting Page Object Model generation with Playwright MCP...");
    console.log(`📄 Page: ${config.pageName}`);
    console.log(`🔗 URL: ${config.url}`);
    console.log(`📝 Description: ${config.description}\n`);
    
    const messages = [];
    
    // Create a prompt that uses Playwright MCP tools
    const prompt = `I need you to generate a Playwright Page Object Model by actually visiting and analyzing the page using the Playwright MCP server.

URL: ${config.url}
Page Name: ${config.pageName}
Description: ${config.description}

Please follow these steps:

1. Use the browser_navigate tool to navigate to ${config.url}
2. Use the browser_snapshot tool to capture the page structure
3. Analyze the snapshot to identify all interactive elements (buttons, inputs, links, dropdowns, etc.)
4. Close the browser with browser_close

After analyzing the real page, generate:
1. A complete TypeScript Page Object Model class with element locators based on the actual page
2. A sample test file using the Page Object Model
3. A list of all elements found on the page

Use the MCP tools mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, and mcp__playwright__browser_close.

Format your final output with:
- Page Object Model code in a \`\`\`typescript code block
- Test file in another \`\`\`typescript code block
- Element list as a markdown list`;

    try {
        console.log("🌐 Connecting to Playwright MCP server...\n");
        
        let fullResponse = '';
        let snapshotData = null;
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 5,
                allowedTools: [
                    "mcp__playwright__browser_navigate",
                    "mcp__playwright__browser_snapshot", 
                    "mcp__playwright__browser_close"
                ],
                // Configure MCP inline
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
            
            if (message.type === 'assistant' && message.message?.content) {
                // Show progress based on tool usage
                if (Array.isArray(message.message.content)) {
                    for (const item of message.message.content) {
                        if (item.type === 'tool_use') {
                            if (item.name === 'mcp__playwright__browser_navigate') {
                                console.log("🌐 Navigating to page...");
                            } else if (item.name === 'mcp__playwright__browser_snapshot') {
                                console.log("📸 Taking page snapshot...");
                            } else if (item.name === 'mcp__playwright__browser_close') {
                                console.log("🚪 Closing browser...");
                            }
                        } else if (item.text) {
                            fullResponse += item.text;
                            
                            // Check if this contains snapshot data
                            if (item.text.includes('role:') || item.text.includes('name:')) {
                                snapshotData = item.text;
                            }
                        }
                    }
                } else if (typeof message.message.content === 'string') {
                    fullResponse += message.message.content;
                }
            }
            
            // Show progress
            process.stdout.write(".");
        }
        
        console.log("\n✅ Analysis complete!\n");
        
        // Extract code from the response
        const result = extractCodeFromResponse(fullResponse);
        result.snapshotData = snapshotData;
        
        return result;
        
    } catch (error) {
        console.error("❌ Error with Playwright MCP:", error);
        
        // If MCP fails, provide helpful error message
        if (error.message.includes('mcp__playwright')) {
            console.error(`
⚠️  Playwright MCP server might not be configured correctly.

To use Playwright MCP, you need to:
1. Make sure you have Chrome/Chromium installed
2. The MCP server will be downloaded automatically via npx

If you continue to have issues, you can use the non-MCP version:
  node index-without-mcp.js ${config.pageName.toLowerCase()}-config.md
`);
        }
        
        throw error;
    }
}

/**
 * Extract code from response text
 */
function extractCodeFromResponse(responseText) {
    const result = {
        pageObjectCode: '',
        testCode: '',
        elements: [],
        snapshotData: null
    };
    
    // Extract TypeScript code blocks
    const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(responseText)) !== null) {
        codeBlocks.push(match[1].trim());
    }
    
    // First code block is the page object
    if (codeBlocks[0]) {
        result.pageObjectCode = codeBlocks[0];
    }
    
    // Second code block is the test
    if (codeBlocks[1]) {
        result.testCode = codeBlocks[1];
    }
    
    // Extract element list - look for various patterns
    const elementPatterns = [
        /(?:Elements found|Elements identified|Element list):\s*\n((?:[-*•]\s*.+\n?)+)/i,
        /(?:### Elements|## Elements)\s*\n((?:[-*•]\s*.+\n?)+)/i,
        /(?:\d+\.\s*.*?elements.*?)\n((?:[-*•]\s*.+\n?)+)/i
    ];
    
    for (const pattern of elementPatterns) {
        const elementMatch = responseText.match(pattern);
        if (elementMatch) {
            const elementLines = elementMatch[1].split('\n').filter(line => line.trim());
            result.elements = elementLines.map(line => line.trim().replace(/^[-*•]\s*/, ''));
            break;
        }
    }
    
    return result;
}

/**
 * Save generated files
 */
async function saveGeneratedFiles(config, generatedCode) {
    const outputDir = path.join(__dirname, 'generated-mcp', config.pageName.toLowerCase());
    
    // Create directories
    await fs.mkdir(path.join(outputDir, 'pages'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'tests'), { recursive: true });
    
    let filesGenerated = false;
    
    // Save page object
    if (generatedCode.pageObjectCode) {
        const pageObjectPath = path.join(outputDir, 'pages', `${config.pageName.toLowerCase()}.page.ts`);
        await fs.writeFile(pageObjectPath, generatedCode.pageObjectCode);
        console.log(`✅ Page Object saved to: ${pageObjectPath}`);
        filesGenerated = true;
    } else {
        console.log(`⚠️  No Page Object code was generated`);
    }
    
    // Save test file
    if (generatedCode.testCode) {
        const testPath = path.join(outputDir, 'tests', `${config.pageName.toLowerCase()}.spec.ts`);
        
        // Fix import path in test file
        let testCode = generatedCode.testCode;
        testCode = testCode.replace(
            /from ['"]\.\/[^'"]+['"]/,
            `from '../pages/${config.pageName.toLowerCase()}.page'`
        );
        
        await fs.writeFile(testPath, testCode);
        console.log(`✅ Test file saved to: ${testPath}`);
        filesGenerated = true;
    } else {
        console.log(`⚠️  No test code was generated`);
    }
    
    // Save element list
    if (generatedCode.elements.length > 0) {
        const elementsPath = path.join(outputDir, 'elements.md');
        const elementsContent = `# Page Elements for ${config.pageName}

## Elements Found via Playwright MCP

${generatedCode.elements.map(e => `- ${e}`).join('\n')}

## Notes
These elements were identified by actually visiting the page using Playwright MCP browser automation.
`;
        await fs.writeFile(elementsPath, elementsContent);
        console.log(`✅ Elements list saved to: ${elementsPath}`);
    }
    
    // Save snapshot data if available
    if (generatedCode.snapshotData) {
        const snapshotPath = path.join(outputDir, 'snapshot.txt');
        await fs.writeFile(snapshotPath, generatedCode.snapshotData);
        console.log(`✅ Page snapshot saved to: ${snapshotPath}`);
    }
    
    // Create a README
    const readmeContent = `# ${config.pageName} Page Object Model (Generated with Playwright MCP)

## Description
${config.description}

## URL
${config.url}

## Generated Files
- \`pages/${config.pageName.toLowerCase()}.page.ts\` - Page Object Model class
- \`tests/${config.pageName.toLowerCase()}.spec.ts\` - Sample test file
- \`elements.md\` - List of identified page elements
- \`snapshot.txt\` - Raw page snapshot from Playwright MCP

## Generation Method
This Page Object Model was generated by:
1. Using Playwright MCP to navigate to the actual page
2. Taking a snapshot of the page structure
3. Analyzing the real DOM elements
4. Generating code based on actual page content

## Usage
\`\`\`typescript
import { ${config.pageName}Page } from './pages/${config.pageName.toLowerCase()}.page';

test('example test', async ({ page }) => {
    const ${config.pageName.toLowerCase()}Page = new ${config.pageName}Page(page);
    await ${config.pageName.toLowerCase()}Page.goto();
    // Add your test steps here
});
\`\`\`

## Running Tests
\`\`\`bash
npx playwright test tests/${config.pageName.toLowerCase()}.spec.ts
\`\`\`
`;
    
    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent);
    console.log(`✅ README saved to: ${path.join(outputDir, 'README.md')}`);
    
    if (!filesGenerated) {
        console.log("\n⚠️  Warning: No TypeScript files were generated. Check the debug output above.");
    }
}

/**
 * Main function
 */
async function main() {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_CODE_USE_BEDROCK && !process.env.CLAUDE_CODE_USE_VERTEX) {
        console.error(`
❌ Error: No authentication configured!

Please create a .env file with:
ANTHROPIC_API_KEY=sk-ant-your-key-here
`);
        process.exit(1);
    }
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Usage: node index-with-mcp.js <path-to-markdown-file>

Example: node index-with-mcp.js example-config.md

This version uses Playwright MCP to actually visit and analyze the page.
The markdown file should contain:
- url: <page-url>
- page_name: <name-for-the-page-object>
- description: <description-of-the-page>

Note: This requires Chrome/Chromium to be available on your system.
`);
        process.exit(1);
    }
    
    const mdFilePath = args[0];
    
    try {
        // Check if file exists
        await fs.access(mdFilePath);
        
        // Parse configuration
        const config = await parseMarkdownConfig(mdFilePath);
        
        if (!config.url || !config.pageName) {
            console.error("❌ Error: Markdown file must contain 'url' and 'page_name' fields");
            process.exit(1);
        }
        
        // Generate Page Object Model with MCP
        const generatedCode = await generatePageObjectModelWithMCP(config);
        
        // Save files
        await saveGeneratedFiles(config, generatedCode);
        
        console.log("\n✨ Page Object Model generation with Playwright MCP completed!");
        console.log("\n📁 Files saved in: generated-mcp/" + config.pageName.toLowerCase());
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        
        // Suggest fallback
        console.log(`
💡 Tip: If Playwright MCP is not working, you can use the non-MCP version:
   node index-without-mcp.js ${args[0]}
`);
        
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
    main();
}

export { parseMarkdownConfig, generatePageObjectModelWithMCP, saveGeneratedFiles };