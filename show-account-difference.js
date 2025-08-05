import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

console.log("🔍 Understanding Your Two Claude Accounts\n");

console.log("1️⃣ Claude Code CLI (Interactive)");
console.log("="*50);
console.log("When you run: claude");
console.log("- Uses: Your Claude Code subscription (Pro/Team/etc)");
console.log("- Billing: Based on your subscription plan");
console.log("- Authentication: claude login (stored in system)");
console.log("- MCP Access: ✅ Yes");

try {
    const whoami = execSync('claude --version', { encoding: 'utf-8' }).trim();
    console.log("- Status:", whoami);
} catch (e) {
    console.log("- Status: Not logged in");
}

console.log("\n2️⃣ Your Script (node index.js)");
console.log("="*50);
console.log("When you run: node index.js");
console.log("- Uses: API key from .env file");
console.log("- Billing: Pay-per-token API usage");
console.log("- Authentication: ANTHROPIC_API_KEY from .env");
console.log("- MCP Access: ✅ Yes (through Claude Code SDK)");
console.log("- API Key:", process.env.ANTHROPIC_API_KEY?.substring(0, 20) + "...");

console.log("\n📊 Key Differences:");
console.log("="*50);
console.log("| Feature          | Claude Code CLI | Your Script     |");
console.log("|------------------|-----------------|-----------------|");
console.log("| Billing          | Subscription    | API usage       |");
console.log("| Rate limits      | Plan-based      | API tier-based  |");
console.log("| Authentication   | claude login    | .env API key    |");
console.log("| MCP servers      | ✅ Available    | ✅ Available    |");
console.log("| Usage tracking   | In Claude Code  | In API console  |");

console.log("\n💡 Summary:");
console.log("- These are TWO DIFFERENT accounts/billing");
console.log("- Your Claude Code subscription is separate from API usage");
console.log("- Both can access the same MCP servers you've configured");
console.log("- The .env API key is ONLY for programmatic/script usage");