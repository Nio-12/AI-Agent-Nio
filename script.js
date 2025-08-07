class NiOChatbot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        
        // Generate a unique session ID for this conversation
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // API base URL
        this.apiBaseUrl = window.location.origin;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Input focus for better UX
        this.messageInput.addEventListener('focus', () => {
            this.messageInput.style.borderColor = 'rgba(0, 212, 255, 0.5)';
        });
        
        this.messageInput.addEventListener('blur', () => {
            this.messageInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (message === '') return;
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send message to backend API
            const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            if (response.ok) {
                // Add bot response
                this.addMessage(data.response, 'bot');
            } else {
                // Handle API errors
                this.addMessage(`Sorry, I encountered an error: ${data.error}`, 'bot');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I\'m having trouble connecting to the server. Please try again.', 'bot');
        }
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const icon = document.createElement('i');
        icon.className = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        content.appendChild(paragraph);
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();
        content.appendChild(time);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-robot';
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NiOChatbot();
});
