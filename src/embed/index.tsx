import React from "react";
import ReactDOM from "react-dom/client";
import Chatbot from "./Chatbot";
import "./embed.css";

// This is the entry point for the embeddable script
// It will mount the chatbot to a target element or create one

interface ChatbotConfig {
  apiUrl?: string;
  title?: string;
  placeholder?: string;
  systemPrompt?: string;
  containerId?: string;
}

function initChatbot(config: ChatbotConfig = {}) {
  const {
    apiUrl,
    title,
    placeholder,
    systemPrompt,
    containerId = "chatbot-root",
  } = config;

  // Check if container already exists
  let container = document.getElementById(containerId);
  
  if (!container) {
    // Create container if it doesn't exist
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }

  // Mount React component
  const root = ReactDOM.createRoot(container);
  root.render(
    <Chatbot
      apiUrl={apiUrl}
      title={title}
      placeholder={placeholder}
      systemPrompt={systemPrompt}
    />
  );

  return {
    unmount: () => root.unmount(),
  };
}

// Function to inject CSS if not already loaded
function injectCSS() {
  // Check if CSS is already injected
  const existingLink = document.querySelector('link[data-chatbot-styles]');
  if (existingLink) {
    return;
  }

  // Get the script tag to determine the base path
  const scriptTag = document.currentScript || 
    document.querySelector('script[src*="chatbot.iife.js"]');
  
  if (scriptTag) {
    const scriptSrc = (scriptTag as HTMLScriptElement).src;
    // Derive CSS path from JS path (same directory, name is style.css)
    const cssPath = scriptSrc.replace(/chatbot\.iife\.js$/, 'style.css');
    
    // Create and inject link tag
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    link.setAttribute('data-chatbot-styles', 'true');
    document.head.appendChild(link);
  }
}

// Make it available globally for embedding
if (typeof window !== "undefined") {
  // Inject CSS automatically
  injectCSS();
  
  (window as any).initChatbot = initChatbot;
  
  // Auto-initialize if data attributes are present
  const scriptTag = document.currentScript;
  if (scriptTag) {
    const apiUrl = scriptTag.getAttribute("data-api-url");
    const title = scriptTag.getAttribute("data-title");
    const placeholder = scriptTag.getAttribute("data-placeholder");
    const containerId = scriptTag.getAttribute("data-container-id");

    if (apiUrl || title || placeholder) {
      initChatbot({
        apiUrl: apiUrl || undefined,
        title: title || undefined,
        placeholder: placeholder || undefined,
        containerId: containerId || undefined,
      });
    }
  }
}

export default initChatbot;

