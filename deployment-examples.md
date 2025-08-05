# Deployment Examples for Page Object Model Generator

## 1. Deploy as API Server

```javascript
// Your server just needs:
// - Node.js runtime
// - .env file with ANTHROPIC_API_KEY
// - Claude Code CLI installed
// - Playwright MCP configured

// Deploy to:
// - AWS Lambda
// - Google Cloud Functions  
// - Heroku
// - Digital Ocean
// - Any Node.js hosting
```

## 2. Slack Bot Integration

```javascript
// Slack Slash Command: /generate-pom url=https://example.com name=HomePage
// Returns generated Page Object Model directly in Slack
```

## 3. GitHub Actions

```yaml
name: Generate Page Object Model
on:
  workflow_dispatch:
    inputs:
      url:
        description: 'Page URL'
        required: true
      pageName:
        description: 'Page Name'
        required: true

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @anthropic-ai/claude-code
      - run: claude mcp add playwright npx @playwright/mcp@latest
      - run: npm install
      - run: node index.js config.md
      - uses: actions/upload-artifact@v3
        with:
          name: generated-pom
          path: generated-auto/
```

## 4. Web UI Integration

```javascript
// React/Vue/Angular app calls your API
fetch('https://your-api.com/generate-pom', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    pageName: 'Example',
    description: 'Homepage'
  })
})
.then(res => res.json())
.then(data => {
  // Display generated code in UI
  console.log(data.pageObject);
  console.log(data.testFile);
});
```

## 5. CLI Tool (npm package)

```json
// package.json
{
  "name": "pom-generator-cli",
  "bin": {
    "generate-pom": "./cli.js"
  }
}
```

```bash
# Users can install globally
npm install -g pom-generator-cli

# Then use anywhere
generate-pom --url https://example.com --name Example
```

## Key Requirements for Deployment:

1. **Environment Variables**:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Dependencies**:
   ```json
   {
     "dependencies": {
       "@anthropic-ai/claude-code": "latest",
       "dotenv": "^16.0.0"
     }
   }
   ```

3. **MCP Configuration**:
   - Either pre-configure on server
   - Or configure programmatically on startup

## Without SDK, You'd Need:

- ❌ Human operator
- ❌ Interactive terminal
- ❌ Manual copy-paste
- ❌ No automation possible
- ❌ No API integration

## With SDK, You Get:

- ✅ Full automation
- ✅ API endpoints
- ✅ Slack/Discord bots
- ✅ CI/CD integration
- ✅ Web UI integration
- ✅ Headless operation
- ✅ Scalable deployment