let chatHistory = [];
let currentChatId = null;

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Handle Enter key
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Hide welcome screen
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    
    // Show back button
    const backButton = document.getElementById('backButtonContainer');
    backButton.style.display = 'block';
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    // Send to backend
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add bot response
        if (data.response) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('Sorry, I could not connect to the server. Please try again.', 'bot');
        console.error('Error:', error);
    }
    
    // Update chat history
    updateChatHistory(message);
}

// Send example prompt
function sendPrompt(prompt) {
    const input = document.getElementById('userInput');
    input.value = prompt;
    sendMessage();
}

// Add message to chat
function addMessage(text, type) {
    const messagesContainer = document.getElementById('messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? 'U' : 'AI';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    // Format message (support for markdown-like formatting)
    messageText.innerHTML = formatMessage(text);
    
    content.appendChild(messageText);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format message with basic markdown support
function formatMessage(text) {
    // Escape HTML
    text = text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // Code blocks
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('messages');
    
    const messageDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    messageDiv.id = typingId;
    messageDiv.className = 'message bot-message';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    content.appendChild(indicator);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return typingId;
}

// Remove typing indicator
function removeTypingIndicator(typingId) {
    const indicator = document.getElementById(typingId);
    if (indicator) {
        indicator.remove();
    }
}

// New chat
function newChat() {
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    welcomeScreen.style.display = 'flex';
    
    const backButton = document.getElementById('backButtonContainer');
    backButton.style.display = 'none';
    
    currentChatId = Date.now();
}

// Go back to main menu
function goBackToMain() {
    newChat();
}

// Update chat history
function updateChatHistory(firstMessage) {
    if (!currentChatId) {
        currentChatId = Date.now();
    }
    
    const historyContainer = document.getElementById('chatHistory');
    
    // Check if this chat already exists in history
    let existingItem = document.getElementById(`chat-${currentChatId}`);
    
    if (!existingItem) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.id = `chat-${currentChatId}`;
        historyItem.textContent = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
        historyItem.onclick = () => loadChat(currentChatId);
        
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        
        // Store in chatHistory array
        chatHistory.push({
            id: currentChatId,
            title: firstMessage,
            messages: []
        });
    }
}

// Load chat (placeholder for future implementation)
function loadChat(chatId) {
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => item.classList.remove('active'));
    
    const selectedItem = document.getElementById(`chat-${chatId}`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    currentChatId = chatId;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('userInput');
    input.focus();

    // Seed conversation with assistant intro
    startAssistantIntro();
});

// Show initial bot greeting and reveal chat area
function startAssistantIntro() {
    const messages = document.getElementById('messages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const backButton = document.getElementById('backButtonContainer');

    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    if (backButton) {
        backButton.style.display = 'block';
    }

    if (messages && messages.children.length === 0) {
        addMessage("Hello! I'm AskMehdi, Mehdi's AI assistant. Ask me anything about Mehdi from his CV.", 'bot');
        currentChatId = Date.now();
    }
}
