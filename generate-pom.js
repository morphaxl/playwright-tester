#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse markdown configuration file
 */
async function parseConfig(mdFile) {
    const content = await fs.readFile(mdFile, 'utf-8');
    
    const config = {
        url: content.match(/url:\s*(.+)/i)?.[1]?.trim() || '',
        pageName: content.match(/page[_\s]?name:\s*(.+)/i)?.[1]?.trim() || '',
        description: content.match(/description:\s*(.+)/i)?.[1]?.trim() || ''
    };
    
    if (!config.url || !config.pageName) {
        throw new Error('Markdown file must contain "url" and "page_name" fields');
    }
    
    return config;
}

/**
 * Save generated files
 */
async function saveFiles(config, pageObject, testFile) {
    const outputDir = path.join(__dirname, 'generated', config.pageName.toLowerCase());
    
    // Create directories
    await fs.mkdir(path.join(outputDir, 'pages'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'tests'), { recursive: true });
    
    // Save page object
    const pageObjectPath = path.join(outputDir, 'pages', `${config.pageName.toLowerCase()}.page.ts`);
    await fs.writeFile(pageObjectPath, pageObject);
    console.log(`✅ Page Object saved to: ${pageObjectPath}`);
    
    // Save test file
    const testPath = path.join(outputDir, 'tests', `${config.pageName.toLowerCase()}.spec.ts`);
    await fs.writeFile(testPath, testFile);
    console.log(`✅ Test file saved to: ${testPath}`);
    
    // Create README
    const readme = `# ${config.pageName} Page Object Model

## Description
${config.description}

## URL
${config.url}

## Generated Files
- \`pages/${config.pageName.toLowerCase()}.page.ts\` - Page Object Model class
- \`tests/${config.pageName.toLowerCase()}.spec.ts\` - Sample test file

## Usage
\`\`\`bash
npx playwright test tests/${config.pageName.toLowerCase()}.spec.ts
\`\`\`
`;
    
    await fs.writeFile(path.join(outputDir, 'README.md'), readme);
    console.log(`✅ README saved to: ${path.join(outputDir, 'README.md')}`);
}

/**
 * Main function - simple prompt for Claude
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Usage: node generate-pom.js <config.md>

Example: node generate-pom.js example-config.md
`);
        process.exit(1);
    }
    
    try {
        // Parse config
        const config = await parseConfig(args[0]);
        
        console.log(`
🚀 Generating Page Object Model
📄 Page: ${config.pageName}
🔗 URL: ${config.url}
📝 Description: ${config.description}

Please use Playwright MCP to:
1. Navigate to ${config.url}
2. Take a snapshot of the page
3. Generate a complete Page Object Model

The files will be saved to: generated/${config.pageName.toLowerCase()}/
`);
        
        // Note: This is where you would manually use Claude with the Playwright MCP
        // to generate the Page Object Model
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();