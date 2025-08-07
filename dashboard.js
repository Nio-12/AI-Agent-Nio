// Dashboard functionality with performance optimizations
class Dashboard {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.isLoading = false;
        this.debounceTimer = null;
        this.observer = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadConversations();
        this.setupIntersectionObserver();
    }

    setupEventListeners() {
        // Use event delegation for better performance
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('conversation-content')) {
                this.handleConversationClick(e.target.closest('.conversation-item'));
            } else if (e.target.classList.contains('delete-button')) {
                this.handleDeleteClick(e.target);
            } else if (e.target.classList.contains('analyze-button')) {
                this.handleAnalyzeClick(e.target);
            } else if (e.target.classList.contains('refresh-button')) {
                this.handleRefreshClick();
            }
        });

        // Debounced search
        const searchInput = document.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.filterConversations(e.target.value);
                }, 300);
            });
        }
    }

    setupIntersectionObserver() {
        // Lazy load conversations when they come into view
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const item = entry.target;
                    if (item.dataset.loaded !== 'true') {
                        this.loadConversationDetails(item);
                    }
                }
            });
        }, {
            root: document.querySelector('.conversations-list'),
            rootMargin: '50px',
            threshold: 0.1
        });
    }

    async loadConversations() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            const response = await fetch('/api/conversations');
            if (!response.ok) throw new Error('Failed to load conversations');
            
            const data = await response.json();
            
            // Handle different response formats
            if (Array.isArray(data)) {
                this.conversations = data;
            } else if (data.conversations && Array.isArray(data.conversations)) {
                this.conversations = data.conversations;
            } else if (data.data && Array.isArray(data.data)) {
                this.conversations = data.data;
            } else {
                console.warn('Unexpected response format:', data);
                this.conversations = [];
            }
            
            this.renderConversations();
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.conversations = [];
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    renderConversations() {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        // Ensure conversations is always an array
        if (!Array.isArray(this.conversations)) {
            console.warn('Conversations is not an array:', this.conversations);
            this.conversations = [];
        }

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        if (this.conversations.length === 0) {
            fragment.appendChild(this.createEmptyState());
        } else {
            this.conversations.forEach(conversation => {
                const element = this.createConversationElement(conversation);
                fragment.appendChild(element);
            });
        }

        // Clear and append in one operation
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    createConversationElement(conversation) {
        const div = document.createElement('div');
        div.className = 'conversation-item';
        div.dataset.id = conversation.id;
        div.dataset.loaded = 'false';
        
        const timestamp = new Date(conversation.created_at).toLocaleString();
        const preview = this.getConversationPreview(conversation.messages);
        
        div.innerHTML = `
            <div class="conversation-content">
                <div class="conversation-id">${conversation.conversation_id}</div>
                <div class="conversation-time">${timestamp}</div>
                <div class="conversation-preview">${preview}</div>
            </div>
            <div class="conversation-actions">
                <button class="analyze-button" title="Analyze conversation">📊</button>
                <button class="delete-button" title="Delete conversation">🗑️</button>
            </div>
        `;

        // Observe for lazy loading
        this.observer.observe(div);
        
        return div;
    }

    getConversationPreview(messages) {
        if (!messages || messages.length === 0) return 'No messages';
        
        const firstMessage = messages[0];
        const text = firstMessage.content || firstMessage.text || '';
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }

    async loadConversationDetails(element) {
        const conversationId = element.dataset.id;
        if (!conversationId) return;

        try {
            const response = await fetch(`/api/conversation/${conversationId}`);
            if (!response.ok) throw new Error('Failed to load conversation details');
            
            const conversation = await response.json();
            element.dataset.loaded = 'true';
            this.observer.unobserve(element);
            
            // Store conversation data for later use
            element.dataset.conversation = JSON.stringify(conversation);
        } catch (error) {
            console.error('Error loading conversation details:', error);
        }
    }

    handleConversationClick(element) {
        if (!element) return;

        // Remove active class from all items
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked item
        element.classList.add('active');

        // Load conversation details if not already loaded
        if (element.dataset.loaded !== 'true') {
            this.loadConversationDetails(element);
        }

        // Display conversation
        this.displayConversation(element);
    }

    displayConversation(element) {
        const conversationData = element.dataset.conversation;
        if (!conversationData) return;

        const conversation = JSON.parse(conversationData);
        const container = document.getElementById('conversationDetail');
        
        if (!container) return;

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Header
        const header = document.createElement('div');
        header.className = 'detail-header';
        header.innerHTML = `
            <h3>Conversation: ${conversation.conversation_id}</h3>
            <p>Created: ${new Date(conversation.created_at).toLocaleString()}</p>
        `;
        fragment.appendChild(header);

        // Messages
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages-container';
        
        if (conversation.messages && conversation.messages.length > 0) {
            conversation.messages.forEach(message => {
                const messageElement = this.createMessageElement(message);
                messagesContainer.appendChild(messageElement);
            });
        } else {
            messagesContainer.innerHTML = '<p>No messages in this conversation</p>';
        }
        
        fragment.appendChild(messagesContainer);

        // Analysis section if available - preserve existing analysis
        if (conversation.lead_analysis) {
            const analysisSection = this.createAnalysisSection(conversation.lead_analysis);
            fragment.appendChild(analysisSection);
        }

        // Clear and append in one operation
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.role || 'user'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'assistant' ? '' : 'U';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message.content || message.text || '';
        
        div.appendChild(avatar);
        div.appendChild(content);
        
        return div;
    }

    createAnalysisSection(analysis) {
        const section = document.createElement('div');
        section.className = 'analysis-section';
        
        const analysisData = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
        
        section.innerHTML = `
            <h3>Lead Analysis</h3>
            <div class="analysis-grid">
                <div class="analysis-item">
                    <label>Name:</label>
                    <span class="value">${analysisData.customerName || 'N/A'}</span>
                </div>
                <div class="analysis-item">
                    <label>Email:</label>
                    <span class="value">${analysisData.customerEmail || 'N/A'}</span>
                </div>
                <div class="analysis-item">
                    <label>Phone:</label>
                    <span class="value">${analysisData.customerPhone || 'N/A'}</span>
                </div>
                <div class="analysis-item">
                    <label>Industry:</label>
                    <span class="value">${analysisData.customerIndustry || 'N/A'}</span>
                </div>
                <div class="analysis-item full-width">
                    <label>Problems/Needs:</label>
                    <span class="value">${analysisData.customerProblem || 'N/A'}</span>
                </div>
                <div class="analysis-item">
                    <label>Availability:</label>
                    <span class="value">${analysisData.customerAvailability || 'N/A'}</span>
                </div>
                <div class="analysis-item">
                    <label>Consultation:</label>
                    <span class="value">${analysisData.customerConsultation ? 'Yes' : 'No'}</span>
                </div>
                <div class="analysis-item full-width">
                    <label>Special Notes:</label>
                    <span class="value">${analysisData.specialNotes || 'N/A'}</span>
                </div>
            </div>
            <div class="lead-quality ${analysisData.leadQuality}">${analysisData.leadQuality}</div>
        `;
        
        return section;
    }

    async handleDeleteClick(button) {
        const item = button.closest('.conversation-item');
        const conversationId = item.dataset.id;
        
        if (!conversationId || !confirm('Are you sure you want to delete this conversation?')) {
            return;
        }

        try {
            const response = await fetch(`/api/conversation/${conversationId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                item.remove();
                this.showSuccessMessage('Conversation deleted successfully');
                
                // Clear detail view if this was the active conversation
                if (item.classList.contains('active')) {
                    document.getElementById('conversationDetail').innerHTML = '<h2>Select a conversation to view details</h2>';
                }
            } else {
                throw new Error('Failed to delete conversation');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            this.showSuccessMessage('Error deleting conversation', 'error');
        }
    }

    async handleAnalyzeClick(button) {
        const item = button.closest('.conversation-item');
        const conversationId = item.dataset.id;
        
        if (!conversationId) return;

        button.disabled = true;
        button.textContent = 'Analyzing...';

        try {
            const response = await fetch(`/api/conversation/${conversationId}/analyze`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                this.showSuccessMessage('Analysis completed successfully');
                
                // Reload conversation details to show analysis
                item.dataset.loaded = 'false';
                await this.loadConversationDetails(item);
                
                // If this conversation is currently selected, update the detail view
                if (item.classList.contains('active')) {
                    this.updateAnalysisSection(item);
                }
            } else {
                throw new Error('Analysis failed');
            }
        } catch (error) {
            console.error('Error analyzing conversation:', error);
            this.showSuccessMessage('Error analyzing conversation', 'error');
        } finally {
            button.disabled = false;
            button.textContent = '📊';
        }
    }

    updateAnalysisSection(element) {
        const conversationData = element.dataset.conversation;
        if (!conversationData) return;

        const conversation = JSON.parse(conversationData);
        const container = document.getElementById('conversationDetail');
        
        if (!container) return;

        // Find existing analysis section
        let existingAnalysis = container.querySelector('.analysis-section');
        
        if (conversation.lead_analysis) {
            const newAnalysisSection = this.createAnalysisSection(conversation.lead_analysis);
            
            if (existingAnalysis) {
                // Replace existing analysis section
                existingAnalysis.replaceWith(newAnalysisSection);
            } else {
                // Add new analysis section after messages
                const messagesContainer = container.querySelector('.messages-container');
                if (messagesContainer) {
                    messagesContainer.after(newAnalysisSection);
                } else {
                    container.appendChild(newAnalysisSection);
                }
            }
        }
    }

    async handleRefreshClick() {
        const button = document.querySelector('.refresh-button');
        if (button) {
            button.disabled = true;
            const icon = button.querySelector('.refresh-icon');
            if (icon) icon.style.animation = 'spin 1s linear infinite';
        }

        await this.loadConversations();

        if (button) {
            button.disabled = false;
            const icon = button.querySelector('.refresh-icon');
            if (icon) icon.style.animation = 'none';
        }
    }

    filterConversations(searchTerm) {
        const items = document.querySelectorAll('.conversation-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const content = item.querySelector('.conversation-content').textContent.toLowerCase();
            item.style.display = content.includes(term) ? 'flex' : 'none';
        });
    }

    showLoadingState() {
        const container = document.getElementById('conversationsList');
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    Loading conversations...
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state is cleared when conversations are rendered
    }

    showErrorState() {
        const container = document.getElementById('conversationsList');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Error Loading Conversations</h3>
                    <p>Failed to load conversations. Please try again.</p>
                    <button class="refresh-button" onclick="dashboard.handleRefreshClick()">
                        <div class="refresh-icon"></div>
                        Retry
                    </button>
                </div>
            `;
        }
    }

    createEmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.innerHTML = `
            <h3>No Conversations</h3>
            <p>No conversations found. Start a chat to see conversations here.</p>
        `;
        return div;
    }

    showSuccessMessage(message, type = 'success') {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = message;
        
        if (type === 'error') {
            messageElement.style.background = 'rgba(220, 53, 69, 0.9)';
        }

        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});

// Global function for navigation
function goToChat() {
    window.location.href = '/';
}
