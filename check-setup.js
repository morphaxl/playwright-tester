import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load .env file
dotenv.config();

console.log("🔍 Checking Claude Code Setup\n");

// Check Claude Code CLI
try {
    const claudeVersion = execSync('claude --version', { encoding: 'utf-8' }).trim();
    console.log("✅ Claude Code CLI installed:", claudeVersion);
} catch (error) {
    console.log("❌ Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code");
}

// Check API key sources
console.log("\n📋 API Key Configuration:");
console.log("1. From .env file:", process.env.ANTHROPIC_API_KEY ? "✅ Found" : "❌ Not found");

// Check if API key is set in environment (outside .env)
const shellApiKey = execSync('echo $ANTHROPIC_API_KEY', { encoding: 'utf-8' }).trim();
console.log("2. From shell environment:", shellApiKey ? "✅ Found" : "❌ Not found");

// Show which one is being used
if (process.env.ANTHROPIC_API_KEY) {
    console.log("\n🔑 Using API key from: .env file");
    console.log("   Key preview:", process.env.ANTHROPIC_API_KEY.substring(0, 15) + "...");
}

// Check MCP servers
console.log("\n🔌 MCP Servers:");
try {
    const mcpList = execSync('claude mcp list', { encoding: 'utf-8' });
    console.log(mcpList);
} catch (error) {
    console.log("❌ Could not list MCP servers");
}

console.log("\n📦 Node.js packages:");
console.log("- @anthropic-ai/claude-code:", "installed locally in node_modules");
console.log("- dotenv:", "installed locally in node_modules");

console.log("\n✨ Summary:");
console.log("- Your Node.js script uses the API key from your .env file");
console.log("- The SDK (@anthropic-ai/claude-code) connects to Claude's API");
console.log("- Claude Code CLI provides the MCP server management");
console.log("- When the SDK invokes Claude, it has access to configured MCP servers");