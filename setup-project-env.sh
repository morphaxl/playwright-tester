#!/bin/bash

# This script loads the .env file for the current shell session
# making it available to both your scripts AND Claude Code CLI

echo "🔧 Setting up project environment..."

if [ -f .env ]; then
    # Export all variables from .env
    export $(grep -v '^#' .env | xargs)
    echo "✅ Loaded .env file"
    echo "   API Key available to:"
    echo "   - Node.js scripts"
    echo "   - Claude Code CLI (in this shell)"
    echo ""
    echo "🚀 You can now use:"
    echo "   node index.js config.md    # Uses API key from .env"
    echo "   claude                     # Also uses API key from .env"
else
    echo "❌ No .env file found"
fi