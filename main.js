/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the github repository
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => OllamaPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  modelName: "gemma3",
  apiEndpoint: "http://localhost:11434",
  temperature: 0.7
};
var VIEW_TYPE_OLLAMA = "sidellama-view";
var OllamaView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.result = "";
    this.abortController = null;
    this.chatHistory = [];
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_OLLAMA;
  }
  getDisplayText() {
    return "Ollama Chat";
  }
  getIcon() {
    return "cloud";
  }
  async onOpen() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.classList.add("ollama-view");
    const chatContainer = containerEl.createDiv({ cls: "ollama-chat-container" });
    const inputDiv = containerEl.createDiv({ cls: "ollama-input" });
    const textArea = inputDiv.createEl("textarea", {
      attr: { rows: "4", placeholder: "Type your message here..." }
    });
    textArea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        sendButton.click();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
      }
    });
    const buttonDiv = inputDiv.createDiv({ cls: "ollama-buttons" });
    const sendButton = buttonDiv.createEl("button", { text: "Ask" });
    const clearButton = buttonDiv.createEl("button", { text: "Clear Chat" });
    const addToEditorButton = buttonDiv.createEl("button", { text: "Add to Editor" });
    const cancelButton = buttonDiv.createEl("button", { text: "\u2715", cls: "cancel-button" });
    addToEditorButton.disabled = true;
    cancelButton.style.display = "none";
    this.responseDiv = chatContainer;
    cancelButton.onclick = () => {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
        cancelButton.style.display = "none";
        sendButton.style.display = "inline-block";
        new import_obsidian.Notice("Generation cancelled");
      }
    };
    const renderMessage = (message, index) => {
      const messageDiv = this.responseDiv.createDiv({ cls: `ollama-message ${message.role}` });
      const roleLabel = messageDiv.createDiv({ cls: "message-role", text: message.role === "user" ? "You" : "Assistant" });
      const contentDiv = messageDiv.createDiv({ cls: "message-content" });
      const actionDiv = messageDiv.createDiv({ cls: "message-actions" });
      const copyButton = actionDiv.createEl("button", {
        cls: "message-action-button",
        attr: { "aria-label": "Copy message" }
      });
      copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1-2-2h9a2 2 0 0 1-2 2v1"></path></svg>';
      copyButton.onclick = () => {
        navigator.clipboard.writeText(message.content).then(() => {
          new import_obsidian.Notice("Copied to clipboard");
        }).catch((err) => {
          console.error("Could not copy text: ", err);
        });
      };
      if (index !== void 0) {
        const deleteButton = actionDiv.createEl("button", {
          cls: "message-action-button",
          attr: { "aria-label": "Delete message" }
        });
        deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="delete-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2v2"></path></svg>';
        deleteButton.onclick = () => {
          this.chatHistory.splice(index, 1);
          this.responseDiv.empty();
          this.chatHistory.forEach((msg, i) => {
            renderMessage(msg, i);
          });
          new import_obsidian.Notice("Message deleted");
        };
      }
      import_obsidian.MarkdownRenderer.renderMarkdown(message.content, contentDiv, "", this.plugin);
      this.responseDiv.scrollTo({
        top: this.responseDiv.scrollHeight,
        behavior: "smooth"
      });
    };
    sendButton.onclick = async () => {
      const prompt = textArea.value;
      if (!prompt)
        return;
      this.chatHistory.push({ role: "user", content: prompt });
      renderMessage(this.chatHistory[this.chatHistory.length - 1], this.chatHistory.length - 1);
      textArea.value = "";
      addToEditorButton.disabled = true;
      cancelButton.style.display = "inline-block";
      sendButton.style.display = "none";
      try {
        this.abortController = new AbortController();
        let responseContent = "";
        let streamingMessageEl = null;
        let contentDiv = null;
        await this.plugin.streamOllama(
          prompt,
          (chunk) => {
            responseContent = chunk;
            if (!streamingMessageEl) {
              streamingMessageEl = this.responseDiv.createDiv({ cls: "ollama-message assistant" });
              const roleLabel = streamingMessageEl.createDiv({ cls: "message-role", text: "Assistant" });
              contentDiv = streamingMessageEl.createDiv({ cls: "message-content" });
              const actionDiv = streamingMessageEl.createDiv({ cls: "message-actions" });
              const copyButton = actionDiv.createEl("button", {
                cls: "message-action-button",
                attr: { "aria-label": "Copy message" }
              });
              copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1-2-2h9a2 2 0 0 1-2 2v1"></path></svg>';
              copyButton.onclick = () => {
                navigator.clipboard.writeText(responseContent).then(() => new import_obsidian.Notice("Copied to clipboard")).catch((err) => console.error("Could not copy text:", err));
              };
            }
            if (contentDiv) {
              contentDiv.empty();
              import_obsidian.MarkdownRenderer.renderMarkdown(responseContent, contentDiv, "", this.plugin);
              this.responseDiv.scrollTo({
                top: this.responseDiv.scrollHeight,
                behavior: "smooth"
              });
            }
            this.result = chunk;
            addToEditorButton.disabled = false;
          },
          this.abortController.signal,
          this.chatHistory
        );
        this.chatHistory.push({ role: "assistant", content: responseContent });
        if (streamingMessageEl) {
          this.responseDiv.removeChild(streamingMessageEl);
        }
        renderMessage(
          { role: "assistant", content: responseContent },
          this.chatHistory.length - 1
        );
      } catch (error) {
        if (error.name === "AbortError") {
          renderMessage({ role: "assistant", content: "*Generation cancelled*" });
        } else {
          new import_obsidian.Notice("Error: " + error.message);
        }
      } finally {
        cancelButton.style.display = "none";
        sendButton.style.display = "inline-block";
        this.abortController = null;
      }
    };
    clearButton.onclick = () => {
      this.chatHistory = [];
      this.responseDiv.empty();
      new import_obsidian.Notice("Chat history cleared");
    };
    addToEditorButton.onclick = async () => {
      let targetLeaf = this.app.workspace.getMostRecentLeaf();
      if (!targetLeaf || !(targetLeaf.view instanceof import_obsidian.MarkdownView)) {
        const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
        if (markdownLeaves.length > 0) {
          targetLeaf = markdownLeaves[0];
        } else {
          new import_obsidian.Notice("Please open a markdown file first");
          return;
        }
      }
      if (targetLeaf && targetLeaf.view instanceof import_obsidian.MarkdownView && this.result) {
        await this.app.workspace.setActiveLeaf(targetLeaf, { focus: true });
        const editor = targetLeaf.view.editor;
        const cursor = editor.getCursor();
        editor.replaceRange(this.result, cursor);
        new import_obsidian.Notice("Added response to editor");
      }
    };
  }
};
var OllamaPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(
      VIEW_TYPE_OLLAMA,
      (leaf) => new OllamaView(leaf, this)
    );
    this.addRibbonIcon("cloud", "Open Chat", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-ollama-chat",
      name: "Open Chat in Sidebar",
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
          active: true
        });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
  async streamOllama(prompt, onChunk, signal, chatHistory) {
    const formattedHistory = (chatHistory || []).map((msg) => `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`).join("\n");
    const contextualPrompt = formattedHistory ? `${formattedHistory}
Human: ${prompt}
Assistant:` : `Human: ${prompt}
Assistant:`;
    const response = await fetch(`${this.settings.apiEndpoint}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.settings.modelName,
        prompt: contextualPrompt,
        temperature: this.settings.temperature,
        stream: true
      }),
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (!response.body) {
      throw new Error("Response body is null");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done)
          break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            fullResponse += data.response;
            onChunk(fullResponse);
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
        if (signal == null ? void 0 : signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
      }
    } catch (err) {
      reader.releaseLock();
      throw err;
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var OllamaSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Model Name").setDesc("The name of the Ollama model to use").addText((text) => text.setPlaceholder("llama2").setValue(this.plugin.settings.modelName).onChange(async (value) => {
      this.plugin.settings.modelName = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("API Endpoint").setDesc("The Ollama API endpoint (default: http://localhost:11434)").addText((text) => text.setPlaceholder("http://localhost:11434").setValue(this.plugin.settings.apiEndpoint).onChange(async (value) => {
      this.plugin.settings.apiEndpoint = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Temperature").setDesc("Controls randomness in the response (0.0 to 1.0)").addSlider((slider) => slider.setLimits(0, 1, 0.1).setValue(this.plugin.settings.temperature).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.temperature = value;
      await this.plugin.saveSettings();
    }));
  }
};
