const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize OpenAI (only if API key is provided)
let openai;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} else {
    console.warn('⚠️  OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
}

// Store conversations in memory (in production, you'd use a database)
const conversations = {};

// Helper function to get conversation history
function getConversationHistory(sessionId) {
    if (!conversations[sessionId]) {
        conversations[sessionId] = [];
    }
    return conversations[sessionId];
}

// API endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get conversation history
        const conversationHistory = getConversationHistory(sessionId);
        
        // Add user message to conversation
        conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        // Prepare messages for OpenAI API
        const messages = [
            {
                role: 'system',
                content: `You are NiO, a helpful and friendly AI assistant. You are knowledgeable, patient, and always try to provide accurate and helpful responses. Keep your responses conversational and engaging.`
            },
            ...conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        let botResponse;
        
        if (openai) {
            // Call OpenAI API
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7,
            });
            botResponse = completion.choices[0].message.content;
        } else {
            // Fallback response when OpenAI is not configured
            botResponse = "I'm sorry, but I'm not currently connected to my AI service. Please configure your OpenAI API key in the .env file to enable AI-powered responses.";
        }

        // Add bot response to conversation
        conversationHistory.push({
            role: 'assistant',
            content: botResponse,
            timestamp: new Date().toISOString()
        });

        // Keep only last 20 messages to prevent context from getting too long
        if (conversationHistory.length > 20) {
            conversationHistory.splice(0, conversationHistory.length - 20);
        }

        res.json({
            response: botResponse,
            sessionId: sessionId,
            conversationLength: conversationHistory.length
        });

    } catch (error) {
        console.error('Error processing chat request:', error);
        
        if (error.code === 'insufficient_quota') {
            res.status(429).json({ 
                error: 'API quota exceeded. Please check your OpenAI account.' 
            });
        } else if (error.code === 'invalid_api_key') {
            res.status(401).json({ 
                error: 'Invalid API key. Please check your OpenAI API key.' 
            });
        } else {
            res.status(500).json({ 
                error: 'An error occurred while processing your request.' 
            });
        }
    }
});

// API endpoint to get conversation history
app.get('/api/conversation/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const conversation = getConversationHistory(sessionId);
    res.json({ conversation });
});

// API endpoint to clear conversation
app.delete('/api/conversation/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    conversations[sessionId] = [];
    res.json({ message: 'Conversation cleared successfully' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        openaiConfigured: !!process.env.OPENAI_API_KEY
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`NiO Chatbot server running on port ${PORT}`);
    console.log(`OpenAI API configured: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
});
