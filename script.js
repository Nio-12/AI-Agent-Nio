class NiOChatbot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        
        // Fixed responses for the chatbot
        this.responses = {
            greetings: [
                "Hello! How can I assist you today?",
                "Hi there! I'm NiO, ready to help!",
                "Greetings! What can I do for you?",
                "Welcome! How may I be of service?"
            ],
            help: [
                "I'm here to help! What do you need assistance with?",
                "I can help you with various tasks. What would you like to know?",
                "Feel free to ask me anything! I'm here to assist.",
                "I'm your AI assistant. How can I help you today?"
            ],
            weather: [
                "I can't check real-time weather, but I'd recommend checking a weather app or website for accurate information!",
                "For current weather conditions, please check your local weather service or weather app.",
                "I don't have access to real-time weather data, but I can help you with other questions!"
            ],
            time: [
                `The current time is ${new Date().toLocaleTimeString()}.`,
                `It's currently ${new Date().toLocaleTimeString()}.`,
                `Right now it's ${new Date().toLocaleTimeString()}.`
            ],
            date: [
                `Today is ${new Date().toLocaleDateString()}.`,
                `The date is ${new Date().toLocaleDateString()}.`,
                `It's ${new Date().toLocaleDateString()} today.`
            ],
            thanks: [
                "You're welcome! Is there anything else I can help you with?",
                "Glad I could help! Let me know if you need anything else.",
                "My pleasure! Feel free to ask if you have more questions.",
                "You're very welcome! I'm here whenever you need assistance."
            ],
            goodbye: [
                "Goodbye! Have a great day!",
                "See you later! Take care!",
                "Farewell! Feel free to come back anytime!",
                "Bye! I'll be here when you need me again!"
            ],
            default: [
                "I'm not sure I understand. Could you please rephrase that?",
                "I'm still learning! Could you try asking that differently?",
                "I don't have a specific response for that, but I'm here to help with other questions!",
                "That's interesting! Could you ask me something else?"
            ]
        };
        
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
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (message === '') return;
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Simulate bot thinking time
        setTimeout(() => {
            this.hideTypingIndicator();
            const botResponse = this.getBotResponse(message);
            this.addMessage(botResponse, 'bot');
        }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    }
    
    getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Check for greetings
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return this.getRandomResponse('greetings');
        }
        
        // Check for help requests
        if (message.includes('help') || message.includes('assist') || message.includes('support')) {
            return this.getRandomResponse('help');
        }
        
        // Check for weather questions
        if (message.includes('weather') || message.includes('temperature') || message.includes('forecast')) {
            return this.getRandomResponse('weather');
        }
        
        // Check for time questions
        if (message.includes('time') && !message.includes('sometime')) {
            return this.getRandomResponse('time');
        }
        
        // Check for date questions
        if (message.includes('date') || message.includes('today') || message.includes('day')) {
            return this.getRandomResponse('date');
        }
        
        // Check for thanks
        if (message.includes('thank') || message.includes('thanks')) {
            return this.getRandomResponse('thanks');
        }
        
        // Check for goodbye
        if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
            return this.getRandomResponse('goodbye');
        }
        
        // Check for name questions
        if (message.includes('name') || message.includes('who are you')) {
            return "I'm NiO, your AI assistant! I'm here to help you with various tasks and questions.";
        }
        
        // Check for capabilities
        if (message.includes('can you') || message.includes('what can you') || message.includes('abilities')) {
            return "I can help you with general questions, provide information, assist with basic tasks, and have conversations. I'm constantly learning and improving!";
        }
        
        // Default response
        return this.getRandomResponse('default');
    }
    
    getRandomResponse(category) {
        const responses = this.responses[category];
        return responses[Math.floor(Math.random() * responses.length)];
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
