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
    
    // Explicitly request code generation without tools
    const prompt = `Generate a Playwright Page Object Model for the following website WITHOUT using any tools or trying to visit the page. Just generate the code based on your knowledge.

URL: ${config.url}
Page Name: ${config.pageName}
Description: ${config.description}

Requirements:
1. Create a complete TypeScript Page Object Model class
2. Create a sample test file
3. List the elements you included

For ${config.url}, based on your knowledge of this site, include appropriate elements like headings, paragraphs, links, etc.

IMPORTANT: 
- DO NOT use any tools
- DO NOT try to navigate to the page
- Just generate the code directly
- Use \`\`\`typescript code blocks for the code

Format:
First, show the Page Object Model class in a typescript code block.
Then, show the test file in another typescript code block.
Finally, list the elements as a markdown list.`;

    try {
        console.log("🤖 Generating Page Object Model...\n");
        
        let fullResponse = '';
        
        for await (const message of query({
            prompt,
            options: {
                maxTurns: 1,
                allowedTools: [] // Explicitly no tools
            }
        })) {
            messages.push(message);
            
            if (message.type === 'assistant' && message.message?.content) {
                // Collect the full response
                if (Array.isArray(message.message.content)) {
                    message.message.content.forEach(item => {
                        if (item.text) {
                            fullResponse += item.text;
                        }
                    });
                } else if (typeof message.message.content === 'string') {
                    fullResponse += message.message.content;
                }
                
                process.stdout.write(".");
            }
        }
        
        console.log("\n✅ Generation complete!\n");
        
        // Extract code from the response
        const result = extractCodeFromResponse(fullResponse);
        return result;
        
    } catch (error) {
        console.error("❌ Error generating Page Object Model:", error);
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
        elements: []
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
        /(?:Elements included|Element list|Elements):\s*\n((?:[-*•]\s*.+\n?)+)/i,
        /(?:### Elements|## Elements)\s*\n((?:[-*•]\s*.+\n?)+)/i,
        /(?:\d+\.\s*Elements.*?)\n((?:[-*•]\s*.+\n?)+)/i
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
    const outputDir = path.join(__dirname, 'generated', config.pageName.toLowerCase());
    
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
        await fs.writeFile(testPath, generatedCode.testCode);
        console.log(`✅ Test file saved to: ${testPath}`);
        filesGenerated = true;
    } else {
        console.log(`⚠️  No test code was generated`);
    }
    
    // Save element list
    if (generatedCode.elements.length > 0) {
        const elementsPath = path.join(outputDir, 'elements.md');
        const elementsContent = `# Page Elements for ${config.pageName}\n\n${generatedCode.elements.map(e => `- ${e}`).join('\n')}`;
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
Usage: node index-fixed.js <path-to-markdown-file>

Example: node index-fixed.js example-config.md
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
        
        console.log("\n✨ Page Object Model generation completed!");
        
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