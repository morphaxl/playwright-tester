import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Programmatically configure MCP servers
 */
async function configureMCP() {
    console.log("🔧 Configuring MCP Servers Programmatically\n");
    
    // Method 1: Using Claude CLI (Recommended)
    try {
        // Check if playwright MCP is already configured
        const mcpList = execSync('claude mcp list', { encoding: 'utf-8' });
        
        if (!mcpList.includes('playwright')) {
            console.log("📦 Adding Playwright MCP server...");
            execSync('claude mcp add playwright npx @playwright/mcp@latest');
            console.log("✅ Playwright MCP added successfully");
        } else {
            console.log("✅ Playwright MCP already configured");
        }
    } catch (error) {
        console.error("❌ Error configuring via CLI:", error.message);
    }
    
    // Method 2: Direct JSON manipulation (Advanced)
    // This modifies the Claude configuration file directly
    const configPaths = [
        path.join(process.cwd(), '.claude.json'),  // Project-specific
        path.join(os.homedir(), '.claude.json')     // User-global
    ];
    
    console.log("\n📄 Configuration file locations:");
    for (const configPath of configPaths) {
        try {
            const exists = await fs.access(configPath).then(() => true).catch(() => false);
            console.log(`- ${configPath}: ${exists ? '✅ Exists' : '❌ Not found'}`);
            
            if (exists) {
                const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
                console.log(`  MCP Servers: ${Object.keys(config.mcpServers || {}).join(', ') || 'none'}`);
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    // Method 3: Project-specific MCP configuration
    console.log("\n📁 Project-specific MCP configuration:");
    const projectMcpPath = path.join(process.cwd(), '.mcp.json');
    
    const projectMcpConfig = {
        mcpServers: {
            playwright: {
                command: "npx",
                args: ["@playwright/mcp@latest"],
                env: {}
            }
        }
    };
    
    try {
        await fs.writeFile(projectMcpPath, JSON.stringify(projectMcpConfig, null, 2));
        console.log(`✅ Created project MCP config: ${projectMcpPath}`);
        console.log("   This can be committed to version control");
    } catch (error) {
        console.error("❌ Error creating project config:", error.message);
    }
}

/**
 * Check which MCP servers are available
 */
async function checkMCPAvailability() {
    console.log("\n🔍 Checking MCP availability in different contexts:\n");
    
    // Check in current shell
    try {
        const result = execSync('claude mcp list', { encoding: 'utf-8' });
        console.log("✅ MCP servers available in this environment:");
        console.log(result);
    } catch (error) {
        console.log("❌ Could not list MCP servers");
    }
    
    // Check via SDK
    console.log("\n📡 When using the SDK:");
    console.log("- The SDK uses the same MCP configuration as your Claude Code CLI");
    console.log("- MCP servers configured locally are available to SDK-invoked Claude");
    console.log("- Each user needs their own MCP configuration");
}

// Run the configuration
console.log("=".repeat(50));
await configureMCP();
await checkMCPAvailability();
console.log("=".repeat(50));

console.log(`
💡 Key Points:
1. MCP servers are configured per-user/per-environment
2. You can configure them programmatically via CLI commands
3. Project-specific configs (.mcp.json) can be shared via Git
4. The SDK uses whatever MCP servers are configured in Claude Code
`);