import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, MarkdownView, Notice, Modal, addIcon } from 'obsidian';

interface OllamaPluginSettings {
    modelName: string;
    apiEndpoint: string;
    temperature: number;
}

const DEFAULT_SETTINGS: OllamaPluginSettings = {
    modelName: 'llama2',
    apiEndpoint: 'http://localhost:11434',
    temperature: 0.7
}

interface OllamaResponse {
    model: string;
    response: string;
    done: boolean;
}

class OllamaModal extends Modal {
    plugin: OllamaPlugin;
    result: string = '';
    responseDiv: HTMLDivElement;
    
    constructor(app: App, plugin: OllamaPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Chat with Ollama' });

        const inputDiv = contentEl.createDiv({ cls: 'ollama-input' });
        const textArea = inputDiv.createEl('textarea', {
            attr: { rows: '4', placeholder: 'Type your message here...' }
        });

        const buttonDiv = inputDiv.createDiv({ cls: 'ollama-buttons' });
        const sendButton = buttonDiv.createEl('button', { text: 'Send' });

        this.responseDiv = contentEl.createDiv({ cls: 'ollama-response' });

        sendButton.onclick = async () => {
            const prompt = textArea.value;
            if (!prompt) return;

            this.responseDiv.empty();
            const loadingDiv = this.responseDiv.createDiv({ text: 'Thinking...' });
            
            try {
                await this.plugin.streamOllama(prompt, (chunk) => {
                    if (loadingDiv) loadingDiv.remove();
                    this.responseDiv.setText(chunk);
                });
            } catch (error) {
                new Notice('Error: ' + error.message);
            }
        };

        contentEl.addClass('ollama-modal');
        this.addStyles();
    }

    private addStyles() {
        const { contentEl } = this;
        const textareaEl = contentEl.querySelector('.ollama-input textarea') as HTMLTextAreaElement;
        const buttonsEl = contentEl.querySelector('.ollama-buttons') as HTMLDivElement;
        const responseEl = contentEl.querySelector('.ollama-response') as HTMLDivElement;

        if (textareaEl) {
            textareaEl.style.width = '100%';
            textareaEl.style.marginBottom = '10px';
        }
        if (buttonsEl) {
            buttonsEl.style.textAlign = 'right';
        }
        if (responseEl) {
            responseEl.style.marginTop = '20px';
            responseEl.style.whiteSpace = 'pre-wrap';
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export default class OllamaPlugin extends Plugin {
    settings: OllamaPluginSettings;

    async onload() {
        await this.loadSettings();

        addIcon('ollama', '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>');
        
        this.addRibbonIcon('ollama', 'Chat with Ollama', () => {
            new OllamaModal(this.app, this).open();
        });

        this.addCommand({
            id: 'ask-ollama',
            name: 'Ask Ollama (Selection)',
            editorCallback: async (editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    new Notice('Please select some text to send to Ollama');
                    return;
                }

                try {
                    let response = '';
                    await this.streamOllama(selection, (chunk) => {
                        response = chunk;
                    });
                    editor.replaceSelection(response);
                } catch (error) {
                    new Notice('Error communicating with Ollama: ' + error.message);
                }
            }
        });

        this.addCommand({
            id: 'open-ollama-chat',
            name: 'Open Ollama Chat',
            callback: () => {
                new OllamaModal(this.app, this).open();
            }
        });

        this.addSettingTab(new OllamaSettingTab(this.app, this));
    }

    async streamOllama(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        const response = await fetch(`${this.settings.apiEndpoint}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.settings.modelName,
                prompt: prompt,
                temperature: this.settings.temperature,
                stream: true
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    fullResponse += data.response;
                    onChunk(fullResponse);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                }
            }
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class OllamaSettingTab extends PluginSettingTab {
    plugin: OllamaPlugin;

    constructor(app: App, plugin: OllamaPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Model Name')
            .setDesc('The name of the Ollama model to use')
            .addText(text => text
                .setPlaceholder('llama2')
                .setValue(this.plugin.settings.modelName)
                .onChange(async (value) => {
                    this.plugin.settings.modelName = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('API Endpoint')
            .setDesc('The Ollama API endpoint (default: http://localhost:11434)')
            .addText(text => text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.apiEndpoint)
                .onChange(async (value) => {
                    this.plugin.settings.apiEndpoint = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls randomness in the response (0.0 to 1.0)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.temperature)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.temperature = value;
                    await this.plugin.saveSettings();
                }));
    }
}