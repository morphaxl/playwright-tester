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
 * Generate Page Object Model
 */
async function generatePageObjectModel(config) {
    console.log("\n🚀 Starting Page Object Model generation...");
    console.log(`📄 Page: ${config.pageName}`);
    console.log(`🔗 URL: ${config.url}`);
    console.log(`📝 Description: ${config.description}\n`);
    
    const messages = [];
    
    // First, let's use a simpler approach without MCP to analyze the page
    const prompt = `I need you to create a Playwright Page Object Model for a website.

URL: ${config.url}
Page Name: ${config.pageName}
Description: ${config.description}

Please analyze what elements would typically be on this page and generate:

1. A complete TypeScript Page Object Model class with:
   - Proper imports
   - Constructor
   - Element locators (use appropriate selectors based on common patterns)
   - Action methods (click, fill, navigate, etc.)
   - Assertion methods (visibility, text verification, etc.)

2. A sample test file that demonstrates how to use the Page Object Model

3. A list of all elements you included with descriptions

Format your response with:
- The Page Object Model code in a TypeScript code block
- The test file in a separate TypeScript code block
- The element list as a markdown list

For ${config.url}, include realistic locators based on common web patterns.`;

    try {
        console.log("🤖 Analyzing page structure...\n");
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 2
            }
        })) {
            messages.push(message);
            
            if (message.type === 'assistant' && message.message?.content) {
                // Just show we're making progress
                process.stdout.write(".");
            }
        }
        
        console.log("\n✅ Analysis complete!\n");
        
        // Extract generated code from messages
        const result = extractGeneratedCode(messages);
        return result;
        
    } catch (error) {
        console.error("❌ Error generating Page Object Model:", error);
        throw error;
    }
}

/**
 * Extract generated code from Claude's messages
 */
function extractGeneratedCode(messages) {
    const result = {
        pageObjectCode: '',
        testCode: '',
        elements: []
    };
    
    // Find the assistant message with the generated code
    const assistantMessages = messages.filter(m => m.type === 'assistant' && m.message?.content);
    
    if (assistantMessages.length > 0) {
        const content = assistantMessages[assistantMessages.length - 1].message.content;
        
        // Handle different content formats
        let textContent = '';
        if (Array.isArray(content)) {
            textContent = content.map(c => c.text || '').join('\n');
        } else if (typeof content === 'string') {
            textContent = content;
        } else if (content[0] && content[0].text) {
            textContent = content[0].text;
        }
        
        // Extract TypeScript code blocks
        const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
        const codeBlocks = [];
        let match;
        
        while ((match = codeBlockRegex.exec(textContent)) !== null) {
            codeBlocks.push(match[1].trim());
        }
        
        // First code block is usually the page object
        if (codeBlocks[0]) {
            result.pageObjectCode = codeBlocks[0];
        }
        
        // Second code block is usually the test
        if (codeBlocks[1]) {
            result.testCode = codeBlocks[1];
        }
        
        // Extract element list
        const elementSection = textContent.match(/(?:elements?|included):\s*\n((?:[-*]\s*.+\n?)+)/i);
        if (elementSection) {
            const elementLines = elementSection[1].split('\n').filter(line => line.trim());
            result.elements = elementLines.map(line => line.trim().replace(/^[-*]\s*/, ''));
        }
    }
    
    return result;
}

/**
 * Save generated files
 */
async function saveGeneratedFiles(config, generatedCode) {
    const outputDir = path.join(__dirname, 'generated', config.pageName.toLowerCase());
    
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
        await fs.writeFile(testPath, generatedCode.testCode);
        console.log(`✅ Test file saved to: ${testPath}`);
    }
    
    // Save element list
    if (generatedCode.elements.length > 0) {
        const elementsPath = path.join(outputDir, 'elements.md');
        const elementsContent = `# Page Elements for ${config.pageName}\n\n${generatedCode.elements.join('\n')}`;
        await fs.writeFile(elementsPath, elementsContent);
        console.log(`✅ Elements list saved to: ${elementsPath}`);
    }
    
    // Create a README
    const readmeContent = `# ${config.pageName} Page Object Model

## Description
${config.description}

## URL
${config.url}

## Generated Files
- \`pages/${config.pageName.toLowerCase()}.page.ts\` - Page Object Model class
- \`tests/${config.pageName.toLowerCase()}.spec.ts\` - Sample test file
- \`elements.md\` - List of identified page elements

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
}

/**
 * Main function
 */
async function main() {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_CODE_USE_BEDROCK && !process.env.CLAUDE_CODE_USE_VERTEX) {
        console.error(`
❌ Error: No authentication configured!

Please set up one of the following:

1. Anthropic API Key (create .env file or set environment variable):
   ANTHROPIC_API_KEY=sk-ant-your-key-here

2. AWS Bedrock:
   CLAUDE_CODE_USE_BEDROCK=1

3. Google Vertex AI:
   CLAUDE_CODE_USE_VERTEX=1
`);
        process.exit(1);
    }
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Usage: node index-v2.js <path-to-markdown-file>

Example: node index-v2.js example-config.md

The markdown file should contain:
- url: <page-url>
- page_name: <name-for-the-page-object>
- description: <description-of-the-page>
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
        
        // Generate Page Object Model
        const generatedCode = await generatePageObjectModel(config);
        
        // Save files
        await saveGeneratedFiles(config, generatedCode);
        
        console.log("\n✨ Page Object Model generation completed successfully!");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
    main();
}

export { parseMarkdownConfig, generatePageObjectModel, saveGeneratedFiles };