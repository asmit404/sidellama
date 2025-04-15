import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, MarkdownView, Notice, ItemView, addIcon, MarkdownRenderer } from 'obsidian';

interface OllamaPluginSettings {
    modelName: string;
    apiEndpoint: string;
    temperature: number;
}

const DEFAULT_SETTINGS: OllamaPluginSettings = {
    modelName: 'gemma3',
    apiEndpoint: 'http://localhost:11434',
    temperature: 0.7,
}

interface OllamaResponse {
    model: string;
    response: string;
    done: boolean;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const VIEW_TYPE_OLLAMA = "sidellama-view";

class OllamaView extends ItemView {
    plugin: OllamaPlugin;
    result: string = '';
    responseDiv: HTMLDivElement;
    abortController: AbortController | null = null;
    chatHistory: ChatMessage[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: OllamaPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_OLLAMA;
    }

    getDisplayText(): string {
        return "Ollama Chat";
    }

    getIcon(): string {
        return "cloud";
    }

    async onOpen() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.classList.add('ollama-view');

        const chatContainer = containerEl.createDiv({ cls: 'ollama-chat-container' });
        
        const inputDiv = containerEl.createDiv({ cls: 'ollama-input' });
        const textArea = inputDiv.createEl('textarea', {
            attr: { rows: '4', placeholder: 'Type your message here...' }
        });

        const buttonDiv = inputDiv.createDiv({ cls: 'ollama-buttons' });
        const sendButton = buttonDiv.createEl('button', { text: 'Ask' });
        const clearButton = buttonDiv.createEl('button', { text: 'Clear Chat' });
        const addToEditorButton = buttonDiv.createEl('button', { text: 'Add to Editor' });
        const cancelButton = buttonDiv.createEl('button', { text: '✕', cls: 'cancel-button' });
        
        addToEditorButton.disabled = true;
        cancelButton.style.display = 'none';

        this.responseDiv = chatContainer;

        clearButton.onclick = () => {
            this.chatHistory = [];
            this.responseDiv.empty();
        };

        cancelButton.onclick = () => {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
                cancelButton.style.display = 'none';
                sendButton.style.display = 'inline-block';
                new Notice('Generation cancelled');
            }
        };

        const renderMessage = (message: ChatMessage) => {
            const messageDiv = this.responseDiv.createDiv({ cls: `ollama-message ${message.role}` });
            const roleLabel = messageDiv.createDiv({ cls: 'message-role', text: message.role === 'user' ? 'You' : 'Assistant' });
            const contentDiv = messageDiv.createDiv({ cls: 'message-content' }) as HTMLElement;
            MarkdownRenderer.renderMarkdown(message.content, contentDiv, '', this.plugin);
            this.responseDiv.scrollTo({
                top: this.responseDiv.scrollHeight,
                behavior: 'smooth'
            });
        };

        sendButton.onclick = async () => {
            const prompt = textArea.value;
            if (!prompt) return;

            this.chatHistory.push({ role: 'user', content: prompt });
            renderMessage(this.chatHistory[this.chatHistory.length - 1]);
            
            textArea.value = '';
            addToEditorButton.disabled = true;
            
            cancelButton.style.display = 'inline-block';
            sendButton.style.display = 'none';
            
            try {
                this.abortController = new AbortController();
                let responseContent = '';
                let contentDiv: HTMLElement | null = null;
                
                await this.plugin.streamOllama(
                    prompt,
                    (chunk) => {
                        responseContent = chunk;
                        if (!contentDiv) {
                            const messageDiv = this.responseDiv.createDiv({ cls: 'ollama-message assistant' });
                            messageDiv.createDiv({ cls: 'message-role', text: 'Assistant' });
                            contentDiv = messageDiv.createDiv({ cls: 'message-content' });
                        }
                        
                        if (contentDiv) {
                            contentDiv.empty();
                            MarkdownRenderer.renderMarkdown(responseContent, contentDiv, '', this.plugin);
                            this.responseDiv.scrollTo({
                                top: this.responseDiv.scrollHeight,
                                behavior: 'smooth'
                            });
                        }
                        
                        this.result = chunk;
                        addToEditorButton.disabled = false;
                    },
                    this.abortController.signal,
                    this.chatHistory
                );
                
                this.chatHistory.push({ role: 'assistant', content: responseContent });
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    renderMessage({ role: 'assistant', content: '*Generation cancelled*' });
                } else {
                    new Notice('Error: ' + error.message);
                }
            } finally {
                cancelButton.style.display = 'none';
                sendButton.style.display = 'inline-block';
                this.abortController = null;
            }
        };

        addToEditorButton.onclick = async () => {
            let targetLeaf = this.app.workspace.getMostRecentLeaf();
            if (!targetLeaf || !(targetLeaf.view instanceof MarkdownView)) {
                const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
                if (markdownLeaves.length > 0) {
                    targetLeaf = markdownLeaves[0];
                } else {
                    new Notice('Please open a markdown file first');
                    return;
                }
            }

            if (targetLeaf && targetLeaf.view instanceof MarkdownView && this.result) {
                await this.app.workspace.setActiveLeaf(targetLeaf, { focus: true });
                const editor = targetLeaf.view.editor;
                const cursor = editor.getCursor();
                editor.replaceRange(this.result, cursor);
                new Notice('Added response to editor');
            }
        };
    }
}

export default class OllamaPlugin extends Plugin {
    settings: OllamaPluginSettings;

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_OLLAMA,
            (leaf) => new OllamaView(leaf, this)
        );
        
        this.addRibbonIcon('cloud', 'Open Chat', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-ollama-chat',
            name: 'Open Chat in Sidebar',
            callback: () => {
                this.activateView();
            }
        });

        this.addSettingTab(new OllamaSettingTab(this.app, this));
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_OLLAMA)[0];
        
        if (!leaf) {
            const newLeaf = workspace.getRightLeaf(false);
            if (newLeaf) {
                leaf = newLeaf;
                await leaf.setViewState({
                    type: VIEW_TYPE_OLLAMA,
                    active: true,
                });
            }
        }
        
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async streamOllama(prompt: string, onChunk: (chunk: string) => void, signal?: AbortSignal, chatHistory?: ChatMessage[]): Promise<void> {
        // Format chat history for the model
        const formattedHistory = (chatHistory || [])
            .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
            .join('\n');
        
        const contextualPrompt = formattedHistory ? 
            `${formattedHistory}\nHuman: ${prompt}\nAssistant:` : 
            `Human: ${prompt}\nAssistant:`;

        const response = await fetch(`${this.settings.apiEndpoint}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.settings.modelName,
                prompt: contextualPrompt,
                temperature: this.settings.temperature,
                stream: true
            }),
            signal,
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