import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load .env file
dotenv.config();

console.log("🔍 Testing API Key in Different Contexts\n");

console.log("1️⃣ In Your Node.js Script:");
console.log("   API Key from .env:", process.env.ANTHROPIC_API_KEY ? "✅ Available" : "❌ Not found");
console.log("   Preview:", process.env.ANTHROPIC_API_KEY?.substring(0, 20) + "...");

console.log("\n2️⃣ In Shell Environment:");
try {
    const shellKey = execSync('echo $ANTHROPIC_API_KEY', { encoding: 'utf-8' }).trim();
    console.log("   API Key in shell:", shellKey ? "✅ Available" : "❌ Not found");
    console.log("   Preview:", shellKey?.substring(0, 20) + "...");
} catch (error) {
    console.log("   ❌ Could not check shell environment");
}

console.log("\n3️⃣ What Claude Code CLI Uses:");
console.log("   When you run 'claude' in terminal:");
console.log("   - Does NOT read your project's .env file");
console.log("   - Uses shell environment variable or saved credentials");

console.log("\n📋 Summary:");
console.log("- Your .env file is ONLY used by your Node.js scripts");
console.log("- It's NOT automatically available to Claude Code CLI");
console.log("- Each context has its own API key source");

console.log("\n💡 To make .env available everywhere in this project:");
console.log("   source .env  # In bash/zsh");
console.log("   # or");
console.log("   export $(cat .env | xargs)  # Load all .env variables");