class Dashboard {
    constructor() {
        this.conversationsList = document.getElementById('conversationsList');
        this.conversationDetail = document.getElementById('conversationDetail');
        this.conversations = [];
        this.selectedConversation = null;
        
        this.init();
    }
    
    init() {
        this.loadConversations();
    }
    
    async loadConversations() {
        try {
            const response = await fetch('/api/conversations');
            const data = await response.json();
            
            if (response.ok) {
                this.conversations = data.conversations;
                this.renderConversationsList();
            } else {
                this.showError('Failed to load conversations: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showError('Failed to connect to server');
        }
    }
    
    renderConversationsList() {
        if (this.conversations.length === 0) {
            this.conversationsList.innerHTML = `
                <div class="empty-state">
                    <h3>No Conversations Found</h3>
                    <p>Start chatting to see conversations here</p>
                    <button class="refresh-button" onclick="dashboard.loadConversations()">Refresh</button>
                </div>
            `;
            return;
        }
        
        // Sort conversations by created_at (newest first)
        const sortedConversations = this.conversations.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        this.conversationsList.innerHTML = sortedConversations.map(conv => {
            const timestamp = new Date(conv.created_at).toLocaleString();
            const preview = this.getConversationPreview(conv.messages);
            
            const hasAnalysis = conv.leadQuality ? 'analyzed' : '';
            const analysisStatus = conv.leadQuality ? 
                `<span class="analysis-status ${conv.leadQuality}">${conv.leadQuality}</span>` : '';
            
            return `
                <div class="conversation-item ${hasAnalysis}">
                    <div class="conversation-content" onclick="dashboard.selectConversation('${conv.conversation_id}')">
                        <div class="conversation-id">${conv.conversation_id}</div>
                        <div class="conversation-time">${timestamp}</div>
                        <div class="conversation-preview">${preview}</div>
                        ${analysisStatus}
                    </div>
                    <div class="conversation-actions">
                        <button class="analyze-button" onclick="dashboard.analyzeConversation('${conv.conversation_id}', event)" title="Analyze Lead">
                            🔍
                        </button>
                        <button class="delete-button" onclick="dashboard.deleteConversation('${conv.conversation_id}', event)" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getConversationPreview(messages) {
        if (!messages || messages.length === 0) {
            return 'No messages';
        }
        
        // Get the first user message as preview
        const firstUserMessage = messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            return firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
        }
        
        return 'Conversation started';
    }
    
    async selectConversation(conversationId) {
        try {
            // Update active state
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const selectedItem = Array.from(document.querySelectorAll('.conversation-item'))
                .find(item => item.querySelector('.conversation-id').textContent === conversationId);
            
            if (selectedItem) {
                selectedItem.classList.add('active');
            }
            
            // Load conversation details
            const response = await fetch(`/api/conversation/${conversationId}`);
            const data = await response.json();
            
            if (response.ok) {
                this.selectedConversation = {
                    conversation_id: conversationId,
                    messages: data.conversation
                };
                this.renderConversationDetail();
            } else {
                this.showError('Failed to load conversation: ' + data.error);
            }
        } catch (error) {
            console.error('Error selecting conversation:', error);
            this.showError('Failed to load conversation details');
        }
    }
    
    renderConversationDetail() {
        if (!this.selectedConversation) {
            this.conversationDetail.innerHTML = `
                <div class="no-conversation">
                    Select a conversation to view details
                </div>
            `;
            return;
        }
        
        const conversation = this.selectedConversation;
        const timestamp = new Date(conversation.created_at || Date.now()).toLocaleString();
        
        // Check if analysis exists using new columns
        const hasAnalysis = conversation.leadQuality || conversation.customerName;
        const analysisSection = hasAnalysis ? this.renderAnalysisSection(conversation) : '';
        const analysisTimestamp = conversation.analyzed_at ? 
            `<p class="analysis-timestamp">Analyzed: ${new Date(conversation.analyzed_at).toLocaleString()}</p>` : '';
        
        this.conversationDetail.innerHTML = `
            <div class="detail-header">
                <h3>Conversation: ${conversation.conversation_id}</h3>
                <p>Created: ${timestamp} | Messages: ${conversation.messages.length}</p>
                ${analysisTimestamp}
            </div>
            ${analysisSection}
            <div class="messages-container">
                ${this.renderMessages(conversation.messages)}
            </div>
        `;
    }
    
    renderAnalysisSection(conversation) {
        const qualityColor = {
            'good': '#28a745',
            'ok': '#ffc107',
            'spam': '#dc3545'
        };
        
        return `
            <div class="analysis-section">
                <h4>Lead Analysis</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <label>Name:</label>
                        <span>${conversation.customerName || 'Not provided'}</span>
                    </div>
                    <div class="analysis-item">
                        <label>Email:</label>
                        <span>${conversation.customerEmail || 'Not provided'}</span>
                    </div>
                    <div class="analysis-item">
                        <label>Phone:</label>
                        <span>${conversation.customerPhone || 'Not provided'}</span>
                    </div>
                    <div class="analysis-item">
                        <label>Industry:</label>
                        <span>${conversation.customerIndustry || 'Not specified'}</span>
                    </div>
                    <div class="analysis-item full-width">
                        <label>Problems/Needs:</label>
                        <span>${conversation.customerProblem || 'Not specified'}</span>
                    </div>
                    <div class="analysis-item">
                        <label>Availability:</label>
                        <span>${conversation.customerAvailability || 'Not specified'}</span>
                    </div>
                    <div class="analysis-item">
                        <label>Consultation Booked:</label>
                        <span>${conversation.customerConsultation ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="analysis-item">
                        <label>Lead Quality:</label>
                        <span class="quality-badge" style="background-color: ${qualityColor[conversation.leadQuality] || '#6c757d'}">
                            ${(conversation.leadQuality || 'unknown').toUpperCase()}
                        </span>
                    </div>
                    ${conversation.specialNotes ? `
                        <div class="analysis-item full-width">
                            <label>Special Notes:</label>
                            <span>${conversation.specialNotes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    renderMessages(messages) {
        if (!messages || messages.length === 0) {
            return '<div class="empty-state"><p>No messages in this conversation</p></div>';
        }
        
        return messages.map((message, index) => {
            const isUser = message.role === 'user';
            const timestamp = new Date().toLocaleTimeString(); // You could add timestamps to messages if needed
            
            return `
                <div class="message ${isUser ? 'user' : 'bot'}">
                    <div class="message-avatar">
                        ${isUser ? 'U' : 'AI'}
                    </div>
                    <div class="message-content">
                        ${message.content}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    async analyzeConversation(conversationId, event) {
        // Prevent event bubbling to avoid selecting the conversation
        event.stopPropagation();
        
        // Show loading state
        const analyzeButton = event.target;
        const originalText = analyzeButton.textContent;
        analyzeButton.textContent = '⏳';
        analyzeButton.disabled = true;
        
        try {
            const response = await fetch(`/api/conversation/${conversationId}/analyze`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Update local conversation with analysis
                const conversationIndex = this.conversations.findIndex(conv => conv.conversation_id === conversationId);
                if (conversationIndex !== -1) {
                    // Update with new column values
                    this.conversations[conversationIndex].customerName = data.analysis.customerName;
                    this.conversations[conversationIndex].customerEmail = data.analysis.customerEmail;
                    this.conversations[conversationIndex].customerPhone = data.analysis.customerPhone;
                    this.conversations[conversationIndex].customerIndustry = data.analysis.customerIndustry;
                    this.conversations[conversationIndex].customerProblem = data.analysis.customerProblem;
                    this.conversations[conversationIndex].customerAvailability = data.analysis.customerAvailability;
                    this.conversations[conversationIndex].customerConsultation = data.analysis.customerConsultation;
                    this.conversations[conversationIndex].specialNotes = data.analysis.specialNotes;
                    this.conversations[conversationIndex].leadQuality = data.analysis.leadQuality;
                    this.conversations[conversationIndex].analyzed_at = data.analyzed_at;
                }
                
                // Re-render the list to show analysis status
                this.renderConversationsList();
                
                // If this conversation is currently selected, update the detail view
                if (this.selectedConversation && this.selectedConversation.conversation_id === conversationId) {
                    // Update with new column values
                    this.selectedConversation.customerName = data.analysis.customerName;
                    this.selectedConversation.customerEmail = data.analysis.customerEmail;
                    this.selectedConversation.customerPhone = data.analysis.customerPhone;
                    this.selectedConversation.customerIndustry = data.analysis.customerIndustry;
                    this.selectedConversation.customerProblem = data.analysis.customerProblem;
                    this.selectedConversation.customerAvailability = data.analysis.customerAvailability;
                    this.selectedConversation.customerConsultation = data.analysis.customerConsultation;
                    this.selectedConversation.specialNotes = data.analysis.specialNotes;
                    this.selectedConversation.leadQuality = data.analysis.leadQuality;
                    this.renderConversationDetail();
                }
                
                // Show success message
                this.showSuccessMessage('Lead analysis completed successfully');
            } else {
                const errorData = await response.json();
                this.showError('Failed to analyze conversation: ' + errorData.error);
            }
        } catch (error) {
            console.error('Error analyzing conversation:', error);
            this.showError('Failed to analyze conversation');
        } finally {
            // Restore button state
            analyzeButton.textContent = originalText;
            analyzeButton.disabled = false;
        }
    }
    
    async deleteConversation(conversationId, event) {
        // Prevent event bubbling to avoid selecting the conversation
        event.stopPropagation();
        
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to delete conversation "${conversationId}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/conversation/${conversationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from local array
                this.conversations = this.conversations.filter(conv => conv.conversation_id !== conversationId);
                
                // If the deleted conversation was selected, clear the detail view
                if (this.selectedConversation && this.selectedConversation.conversation_id === conversationId) {
                    this.selectedConversation = null;
                    this.renderConversationDetail();
                }
                
                // Re-render the list
                this.renderConversationsList();
                
                // Show success message
                this.showSuccessMessage('Conversation deleted successfully');
            } else {
                const data = await response.json();
                this.showError('Failed to delete conversation: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            this.showError('Failed to delete conversation');
        }
    }
    
    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
    
    showError(message) {
        this.conversationsList.innerHTML = `
            <div class="empty-state">
                <h3>Error</h3>
                <p>${message}</p>
                <button class="refresh-button" onclick="dashboard.loadConversations()">Retry</button>
            </div>
        `;
    }
}

// Global function to go back to chat
function goToChat() {
    window.location.href = 'index.html';
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});
