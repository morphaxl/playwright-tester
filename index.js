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
 * Generate Page Object Model using Playwright MCP through SDK
 */
async function generatePageObjectModelWithMCP(config) {
    console.log("\n🚀 Starting Page Object Model generation with Playwright MCP...");
    console.log(`📄 Page: ${config.pageName}`);
    console.log(`🔗 URL: ${config.url}`);
    console.log(`📝 Description: ${config.description}\n`);
    
    const messages = [];
    
    // Create prompt that will use Playwright MCP tools
    const prompt = `Please use the Playwright MCP tools to generate a Page Object Model for this website:

URL: ${config.url}
Page Name: ${config.pageName}
Description: ${config.description}

Steps:
1. Use mcp__playwright__browser_navigate to go to ${config.url}
2. Use mcp__playwright__browser_snapshot to capture the page structure
3. Analyze the snapshot and create:
   - A complete TypeScript Page Object Model class named ${config.pageName}Page
   - Include all interactive elements (buttons, inputs, links, etc.)
   - Add action methods (click, fill, navigate)
   - Add assertion methods (isVisible, hasText)
   - A sample test file showing how to use the Page Object
4. Use mcp__playwright__browser_close to close the browser

Format the output with:
- Page Object Model in a \`\`\`typescript code block
- Test file in another \`\`\`typescript code block`;

    try {
        console.log("🤖 Using Claude with Playwright MCP...\n");
        
        let fullResponse = '';
        let pageObjectCode = '';
        let testCode = '';
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 10, // Allow more turns for MCP tool usage
                allowedTools: [
                    "mcp__playwright__browser_navigate",
                    "mcp__playwright__browser_snapshot",
                    "mcp__playwright__browser_close"
                ]
            }
        })) {
            messages.push(message);
            
            if (message.type === 'assistant' && message.message?.content) {
                // Track tool usage
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
                        }
                    }
                } else if (typeof message.message.content === 'string') {
                    fullResponse += message.message.content;
                }
            }
            
            // Show progress
            process.stdout.write(".");
        }
        
        console.log("\n\n✅ Analysis complete!\n");
        
        // Extract TypeScript code blocks
        const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
        const codeBlocks = [];
        let match;
        
        while ((match = codeBlockRegex.exec(fullResponse)) !== null) {
            codeBlocks.push(match[1].trim());
        }
        
        if (codeBlocks[0]) pageObjectCode = codeBlocks[0];
        if (codeBlocks[1]) testCode = codeBlocks[1];
        
        return { pageObjectCode, testCode };
        
    } catch (error) {
        console.error("❌ Error with Playwright MCP:", error);
        throw error;
    }
}

/**
 * Save generated files
 */
async function saveGeneratedFiles(config, generatedCode) {
    const outputDir = path.join(__dirname, 'generated-auto', config.pageName.toLowerCase());
    
    // Create directories
    await fs.mkdir(path.join(outputDir, 'pages'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'tests'), { recursive: true });
    
    // Save page object
    if (generatedCode.pageObjectCode) {
        const pageObjectPath = path.join(outputDir, 'pages', `${config.pageName.toLowerCase()}.page.ts`);
        await fs.writeFile(pageObjectPath, generatedCode.pageObjectCode);
        console.log(`✅ Page Object saved to: ${pageObjectPath}`);
    }
    
    // Save test file
    if (generatedCode.testCode) {
        const testPath = path.join(outputDir, 'tests', `${config.pageName.toLowerCase()}.spec.ts`);
        // Fix import path
        let testCode = generatedCode.testCode;
        testCode = testCode.replace(/from ['"]\.\/[^'"]+['"]/, `from '../pages/${config.pageName.toLowerCase()}.page'`);
        await fs.writeFile(testPath, testCode);
        console.log(`✅ Test file saved to: ${testPath}`);
    }
    
    // Create README
    const readmeContent = `# ${config.pageName} Page Object Model (Auto-Generated with MCP)

## Description
${config.description}

## URL
${config.url}

## Generated Files
- \`pages/${config.pageName.toLowerCase()}.page.ts\` - Page Object Model class
- \`tests/${config.pageName.toLowerCase()}.spec.ts\` - Sample test file

## Generation Method
This Page Object Model was automatically generated by:
1. Using Claude Code SDK to invoke Claude
2. Claude used Playwright MCP to navigate to the actual page
3. Analyzed the real DOM structure
4. Generated code based on actual page content

## Usage
\`\`\`bash
npx playwright test tests/${config.pageName.toLowerCase()}.spec.ts
\`\`\`
`;
    
    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent);
    console.log(`✅ README saved to: ${path.join(outputDir, 'README.md')}`);
}

/**
 * Main function
 */
async function main() {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error(`
❌ Error: No API key found!

Please create a .env file with:
ANTHROPIC_API_KEY=sk-ant-your-key-here
`);
        process.exit(1);
    }
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Automatic Playwright Page Object Generator (with MCP)
====================================================

This tool automatically generates Page Object Models by using Claude Code SDK
to invoke Claude, which then uses Playwright MCP to analyze real web pages.

Usage: node index-auto-mcp.js <path-to-markdown-file>

Example: node index-auto-mcp.js example-config.md

Prerequisites:
- Playwright MCP must be configured: claude mcp add playwright npx @playwright/mcp@latest
- API key in .env file
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
        
        console.log("\n✨ Automatic Page Object Model generation completed!");
        console.log(`📁 Files saved in: generated-auto/${config.pageName.toLowerCase()}/`);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
    main();
}

export { parseMarkdownConfig, generatePageObjectModelWithMCP, saveGeneratedFiles };