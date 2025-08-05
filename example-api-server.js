import express from 'express';
import multer from 'multer';
import { parseMarkdownConfig, generatePageObjectModelWithMCP, saveGeneratedFiles } from './index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

/**
 * API Endpoint to generate Page Object Model
 */
app.post('/generate-pom', express.json(), async (req, res) => {
    try {
        const { url, pageName, description } = req.body;
        
        if (!url || !pageName) {
            return res.status(400).json({ 
                error: 'Missing required fields: url and pageName' 
            });
        }

        const config = { url, pageName, description };
        
        console.log(`📡 API Request: Generate POM for ${pageName}`);
        
        // Generate Page Object Model
        const generatedCode = await generatePageObjectModelWithMCP(config);
        
        // Return the generated code
        res.json({
            success: true,
            pageName,
            url,
            pageObject: generatedCode.pageObjectCode,
            testFile: generatedCode.testCode
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Generation failed', 
            message: error.message 
        });
    }
});

/**
 * API Endpoint with file upload
 */
app.post('/generate-pom-from-file', upload.single('config'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Parse the uploaded markdown file
        const config = await parseMarkdownConfig(req.file.path);
        
        // Generate Page Object Model
        const generatedCode = await generatePageObjectModelWithMCP(config);
        
        // Save files
        await saveGeneratedFiles(config, generatedCode);
        
        // Create zip file with generated code
        const zipPath = path.join(__dirname, `generated-${Date.now()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip');
        
        archive.pipe(output);
        archive.directory(`generated-auto/${config.pageName.toLowerCase()}`, false);
        await archive.finalize();
        
        // Send zip file
        res.download(zipPath, `${config.pageName}-page-object.zip`, () => {
            // Clean up
            fs.unlink(zipPath);
            fs.unlink(req.file.path);
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Generation failed', 
            message: error.message 
        });
    }
});

/**
 * Slack Slash Command Handler
 */
app.post('/slack-generate', express.urlencoded({ extended: true }), async (req, res) => {
    const { text, response_url } = req.body;
    
    // Parse Slack command: /generate-pom url=https://example.com name=Example
    const params = {};
    text.split(' ').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) params[key] = value;
    });
    
    if (!params.url || !params.name) {
        return res.json({
            text: '❌ Usage: /generate-pom url=https://example.com name=PageName'
        });
    }
    
    // Acknowledge immediately (Slack requires response within 3 seconds)
    res.json({
        text: `🚀 Generating Page Object Model for ${params.name}...`
    });
    
    // Generate asynchronously and post back to Slack
    try {
        const config = {
            url: params.url,
            pageName: params.name,
            description: `Generated via Slack for ${params.url}`
        };
        
        const generatedCode = await generatePageObjectModelWithMCP(config);
        
        // Post results back to Slack
        await fetch(response_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `✅ Page Object Model generated for ${params.name}!`,
                attachments: [{
                    title: `${params.name}Page.ts`,
                    text: '```typescript\n' + generatedCode.pageObjectCode + '\n```',
                    color: 'good'
                }]
            })
        });
        
    } catch (error) {
        await fetch(response_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `❌ Generation failed: ${error.message}`
            })
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Page Object Model Generator',
        sdkVersion: '1.0.0'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Page Object Model API Server running on port ${PORT}`);
    console.log(`
Available endpoints:
- POST /generate-pom          - Generate from JSON body
- POST /generate-pom-from-file - Generate from uploaded markdown
- POST /slack-generate        - Slack slash command handler
- GET  /health               - Health check
    `);
});