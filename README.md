# SideLlama

SideLlama is a plugin for Obsidian that allows you to chat with local AI models using Ollama. It provides a user-friendly interface to interact with your models, making it easy to generate text, answer questions, and more.

This plugin is designed to enhance your note-taking experience by integrating AI capabilities directly into your Obsidian workspace.

## Features

- 💬 Chat interface for interacting with Ollama models
- 🎯 Customizable model selection
- 🔧 Adjustable temperature settings
- 🚀 Streaming responses for real-time interaction
- 📝 Add responses directly to your notes

## Prerequisites

- [Obsidian](https://obsidian.md/) v0.15.0 or higher
- [Ollama](https://ollama.ai/) installed and running locally
- [gemma3](https://ollama.com/library/gemma3) downloaded and available in your Ollama models

## Installation

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click on "Browse" and search for this plugin
4. Install the plugin
5. Enable the plugin in your Obsidian settings

## Usage

1. Open the command palette (Ctrl+P or Cmd+P)
2. Type "Ollama" to find the commands
3. Select "Open Chat in Sidebar" to open the chat interface
4. Start chatting with your local AI model

### Chat Interface

1. Click the Ollama icon in the left ribbon
2. Type your message in the text area
3. Click "Ask" to get a response
4. Use "Add to Editor" to insert responses into your notes
5. Use "Clear Chat" to start a fresh conversation

### Commands

- `Open Chat in Sidebar`: Open the chat interface

## Configuration

You can configure the following settings:

- **Model Name**: Choose which Ollama model to use (default: gemma3)
- **API Endpoint**: Set custom API endpoint (default: <http://localhost:11434>)
- **Temperature**: Adjust response randomness (0.0 to 1.0) (default: 0.7)

## Development

```bash
# Clone the repository
git clone https://github.com/asmit404/sidellama.git

# Install dependencies
npm install

# Build the plugin
npm run build

# Development mode
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have suggestions, please visit the [GitHub issues page](https://github.com/asmit404/sidellama/issues).
