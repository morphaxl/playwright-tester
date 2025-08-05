# Playwright Page Object Model Generator

An AI-powered tool that automatically generates Playwright Page Object Model (POM) tests by analyzing web pages using the Playwright MCP (Model Context Protocol) server.

## Features

- 🤖 Uses Claude AI with Playwright MCP to analyze web pages
- 🎯 Automatically identifies interactive elements and generates appropriate locators
- 📝 Creates TypeScript Page Object Model classes with best practices
- 🧪 Generates sample test files using the Page Object Model
- 📋 Provides a list of all identified elements with their locators

## Prerequisites

- Node.js 18 or newer
- npm or yarn
- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
- **Anthropic API key** (required for authentication)

## Authentication Setup

You must set up authentication before using this tool. You can use either a `.env` file or environment variables.

### Using .env File (Recommended)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```

3. Get an API key from [Anthropic Console](https://console.anthropic.com/)

### Alternative: Environment Variables

#### Option 1: Anthropic API Key
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

#### Option 2: AWS Bedrock
```bash
export CLAUDE_CODE_USE_BEDROCK=1
# Configure AWS credentials as usual
```

#### Option 3: Google Vertex AI
```bash
export CLAUDE_CODE_USE_VERTEX=1
# Configure Google Cloud credentials as usual
```

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### 1. Setup Playwright MCP (One-time setup)

```bash
# Add Playwright MCP server to Claude Code
claude mcp add playwright npx @playwright/mcp@latest

# Verify it's connected
claude mcp list
```

### 2. Create a Configuration File

Create a markdown file with your page configuration:

```markdown
# Test Configuration

url: https://your-website.com/page
page_name: YourPageName
description: Description of what this page does

## Additional Notes
Any additional context about the page...
```

### 3. Generate Page Object Model

Simply run:

```bash
node index.js your-config.md
```

This will automatically:
1. Use the Claude Code SDK to invoke Claude
2. Claude will use Playwright MCP to navigate to the actual page
3. Take a real DOM snapshot of the page
4. Generate accurate Page Object Model with exact selectors
5. Save the files to `generated-auto/yourpagename/`

**Example:**
```bash
node index.js example-config.md
```

**Alternative:** If you prefer the quick version without visiting the page:
```bash
node index-without-mcp.js your-config.md
```

### 4. Check Generated Files

The tool will create a `generated-auto` directory containing:
- `pages/` - Page Object Model classes
- `tests/` - Sample test files
- `elements.md` - List of identified elements
- `README.md` - Documentation for the generated files

## Example

Run the included example:

```bash
node index.js example-config.md
```

This will analyze example.com and generate a complete Page Object Model.

## When to Use Each Version

### Use Without MCP (Default) When:
- You want quick results
- The page structure is well-known (like popular sites)
- You don't need exact DOM selectors
- You're generating initial boilerplate code

### Use With MCP When:
- You need accurate selectors from the actual page
- The page has dynamic content
- You're working with internal/private sites
- You want to capture the exact current state of the page

## How It Works

1. **Configuration Parsing**: Reads your markdown file to get the URL and page details
2. **Page Analysis**: Uses Playwright MCP to navigate to the page and take a snapshot
3. **Element Identification**: Claude AI analyzes the snapshot to identify all interactive elements
4. **Code Generation**: Generates TypeScript code following Page Object Model best practices
5. **File Creation**: Saves all generated files in an organized structure

## Generated Code Structure

### Page Object Model Class
```typescript
export class YourPageNamePage {
    constructor(private page: Page) {}
    
    // Element locators
    get submitBtn() { return this.page.locator('#submit'); }
    get emailInput() { return this.page.locator('input[type="email"]'); }
    
    // Actions
    async clickSubmitBtn() {
        await this.submitBtn.click();
    }
    
    async fillEmailInput(value: string) {
        await this.emailInput.fill(value);
    }
    
    // Assertions
    async verifySubmitBtnVisible() {
        await expect(this.submitBtn).toBeVisible();
    }
}
```

### Test File
```typescript
test('should interact with page elements', async ({ page }) => {
    const yourPage = new YourPageNamePage(page);
    await yourPage.goto();
    await yourPage.fillEmailInput('test@example.com');
    await yourPage.clickSubmitBtn();
});
```

## Configuration Options

The markdown configuration file supports:
- `url` (required): The URL of the page to analyze
- `page_name` (required): Name for the Page Object Model class
- `description` (optional): Description of the page functionality

## Troubleshooting

### MCP Server Connection Issues
- Ensure you have the latest Claude Code CLI installed
- Check that your ANTHROPIC_API_KEY is set correctly
- Try running with `--verbose` flag for more detailed output

### Page Analysis Issues
- Make sure the URL is publicly accessible
- Complex pages might require multiple analysis turns
- Dynamic content may need additional wait strategies

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT