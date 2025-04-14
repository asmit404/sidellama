# Obsidian Ollama Plugin

Chat with local AI models directly within Obsidian using Ollama.

## Features

- 💬 Chat interface for interacting with Ollama models
- ✨ Text completion from selection
- 🎯 Customizable model selection
- 🔧 Adjustable temperature settings
- 🚀 Streaming responses for real-time interaction

## Prerequisites

- [Obsidian](https://obsidian.md/) v0.15.0 or higher
- [Ollama](https://ollama.ai/) installed and running locally

## Installation

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click on "Browse" and search for "Ollama"
4. Install the plugin
5. Enable the plugin in your Obsidian settings

## Usage

### Chat Interface

1. Click the Ollama icon in the left ribbon
2. Type your message in the text area
3. Click "Send" to get a response

### Text Completion

1. Select text in any note
2. Use the command palette (Cmd/Ctrl + P)
3. Search for "Ask Ollama (Selection)"
4. The selected text will be replaced with Ollama's response

### Commands

- `Ask Ollama (Selection)`: Get completion for selected text
- `Open Ollama Chat`: Open the chat interface

## Configuration

You can configure the following settings:

- **Model Name**: Choose which Ollama model to use
- **API Endpoint**: Set custom API endpoint (default: http://localhost:11434)
- **Temperature**: Adjust response randomness (0.0 to 1.0)

## Development

```bash
# Clone the repository
git clone https://github.com/asmit404/obsidian-ollama.git

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

If you encounter any issues or have suggestions, please visit the [GitHub issues page](https://github.com/asmit404/obsidian-ollama/issues).