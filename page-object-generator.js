import { query } from "@anthropic-ai/claude-code";
import fs from 'fs/promises';
import path from 'path';

class PageObjectGenerator {
    constructor() {
        this.messages = [];
        this.pageElements = [];
    }

    /**
     * Navigate to the URL and get page snapshot with locators
     */
    async navigateAndGetLocators(url) {
        console.log(`🌐 Navigating to ${url} and getting page structure...`);
        
        const prompt = `
I need you to use the Playwright MCP server to:
1. Navigate to ${url}
2. Get a page snapshot with all the interactive elements and their locators
3. Identify all clickable elements, input fields, dropdowns, buttons, links, etc.
4. Return the results in a structured format

Please use the browser_navigate and browser_snapshot tools from the Playwright MCP server.
After taking the snapshot, analyze it and provide me with a list of all interactive elements with their:
- Element type (button, input, link, dropdown, etc.)
- Text content or label
- Suggested element name for the page object
- Best locator strategy (id, class, text, etc.)
- The actual locator value
`;

        try {
            for await (const message of query({
                prompt,
                options: {
                    maxTurns: 3,
                    allowedTools: [
                        "mcp__playwright__browser_navigate",
                        "mcp__playwright__browser_snapshot",
                        "mcp__playwright__browser_close"
                    ],
                    mcp_config: {
                        mcpServers: {
                            playwright: {
                                command: "npx",
                                args: ["@playwright/mcp@latest"]
                            }
                        }
                    }
                }
            })) {
                this.messages.push(message);
                
                if (message.type === 'assistant' && message.message?.content) {
                    console.log("🤖 Assistant:", message.message.content.substring(0, 200) + "...");
                }
            }
            
            // Extract structured elements from the response
            this.extractPageElements();
            
        } catch (error) {
            console.error("❌ Error getting page locators:", error);
            throw error;
        }
    }

    /**
     * Extract page elements from assistant messages
     */
    extractPageElements() {
        // Look for the last assistant message that contains the structured data
        const lastAssistantMsg = this.messages
            .filter(m => m.type === 'assistant' && m.message?.content)
            .pop();
            
        if (!lastAssistantMsg) {
            console.warn("⚠️ No assistant response found");
            return;
        }
        
        const content = lastAssistantMsg.message.content;
        
        // Try to parse structured data from the response
        // The assistant should provide elements in a specific format
        // For now, we'll use a simple regex pattern to extract elements
        
        // Example pattern to match element descriptions
        const elementPattern = /- (\w+):\s*"([^"]+)"\s*(?:with text "([^"]+)")?/g;
        let match;
        
        while ((match = elementPattern.exec(content)) !== null) {
            this.pageElements.push({
                type: match[1],
                locator: match[2],
                text: match[3] || '',
                name: this.generateElementName(match[1], match[3] || match[2])
            });
        }
        
        console.log(`📋 Found ${this.pageElements.length} page elements`);
    }

    /**
     * Generate a meaningful element name for the page object
     */
    generateElementName(type, textOrLocator) {
        // Clean up the text/locator to create a valid variable name
        let name = textOrLocator
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
            
        // Add type suffix
        const typeSuffix = {
            'button': 'Btn',
            'input': 'Input',
            'link': 'Link',
            'dropdown': 'Dropdown',
            'checkbox': 'Checkbox',
            'radio': 'Radio',
            'text': 'Text'
        };
        
        return name + (typeSuffix[type.toLowerCase()] || 'Element');
    }

    /**
     * Generate Page Object Model class
     */
    generatePageObjectClass(pageName, url) {
        const className = pageName.charAt(0).toUpperCase() + pageName.slice(1) + 'Page';
        
        let classContent = `import { Page, expect } from '@playwright/test';

export class ${className} {
    constructor(private page: Page) {}
    
    // Page URL
    readonly url = '${url}';
    
    // Page Elements
`;

        // Add element locators
        this.pageElements.forEach(element => {
            classContent += `    get ${element.name}() { return this.page.locator('${element.locator}'); }\n`;
        });
        
        classContent += `
    // Navigation
    async goto() {
        await this.page.goto(this.url);
    }
    
    // Actions
`;

        // Generate action methods
        this.pageElements.forEach(element => {
            if (element.type.toLowerCase() === 'button' || element.type.toLowerCase() === 'link') {
                classContent += `    async click${this.capitalize(element.name)}() {
        await this.${element.name}.click();
    }\n\n`;
            } else if (element.type.toLowerCase() === 'input') {
                classContent += `    async fill${this.capitalize(element.name)}(value: string) {
        await this.${element.name}.fill(value);
    }\n\n`;
            }
        });
        
        classContent += `    // Assertions
`;

        // Generate assertion methods
        this.pageElements.forEach(element => {
            classContent += `    async verify${this.capitalize(element.name)}Visible() {
        await expect(this.${element.name}).toBeVisible();
    }\n\n`;
        });
        
        classContent += `}`;
        
        return classContent;
    }

    /**
     * Generate test file
     */
    generateTestFile(pageName, pageObjectPath) {
        const className = pageName.charAt(0).toUpperCase() + pageName.slice(1) + 'Page';
        
        return `import { test, expect } from '@playwright/test';
import { ${className} } from '${pageObjectPath}';

test.describe('${className} Tests', () => {
    let ${pageName}Page: ${className};
    
    test.beforeEach(async ({ page }) => {
        ${pageName}Page = new ${className}(page);
        await ${pageName}Page.goto();
    });
    
    test('should load page successfully', async () => {
        // Add your test assertions here
        ${this.pageElements.slice(0, 3).map(element => 
            `await ${pageName}Page.verify${this.capitalize(element.name)}Visible();`
        ).join('\n        ')}
    });
    
    // Add more tests here
});`;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Save generated files
     */
    async saveFiles(outputDir, pageName) {
        // Create output directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });
        await fs.mkdir(path.join(outputDir, 'pages'), { recursive: true });
        await fs.mkdir(path.join(outputDir, 'tests'), { recursive: true });
        
        // Generate and save page object
        const pageObjectContent = this.generatePageObjectClass(pageName, this.url);
        const pageObjectPath = path.join(outputDir, 'pages', `${pageName}.page.ts`);
        await fs.writeFile(pageObjectPath, pageObjectContent);
        console.log(`✅ Page object saved to: ${pageObjectPath}`);
        
        // Generate and save test file
        const testContent = this.generateTestFile(pageName, `../pages/${pageName}.page`);
        const testPath = path.join(outputDir, 'tests', `${pageName}.spec.ts`);
        await fs.writeFile(testPath, testContent);
        console.log(`✅ Test file saved to: ${testPath}`);
    }
}

export default PageObjectGenerator;