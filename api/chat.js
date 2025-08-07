const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.replace(/\n/g, '') || '',
});

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get existing conversation from Supabase
        let { data: existingConversation, error: fetchError } = await supabase
            .from('conversations')
            .select('messages')
            .eq('conversation_id', sessionId)
            .single();

        let conversation = [];
        if (existingConversation) {
            conversation = existingConversation.messages || [];
        }

        // Add user message to conversation history
        conversation.push({ role: 'user', content: message });

        // Prepare messages for OpenAI (include system message and conversation history)
        const messages = [
            {
                role: 'system',
                content: `You are the Nio AI Assistant - a friendly and helpful virtual assistant representing AI, a company that offers AI consulting and implementation services.
Your goal is to guide users through a structured discovery conversation to understand their industry, challenges, and contact details, and recommend appropriate services.
Always keep responses short, helpful, and polite.
Always reply in the same language the user speaks.
Ask only one question at a time.

RECOMMENDED SERVICES:
- For real estate: Mention customer data extraction from documents, integration with CRM, and lead generation via 24/7 chatbots.
- For education: Mention email automation and AI training.
- For retail/customer service: Mention voice-based customer service chatbots, digital marketing, and AI training.
- For other industries: Mention chatbots, process automation, and digital marketing.

BENEFITS: Emphasize saving time, reducing costs, and improving customer satisfaction.
PRICING: Only mention 'starting from $1000 USD' if the user explicitly asks about pricing.

CONVERSATION FLOW:
1. Ask what industry the user works in.
2. Then ask what specific challenges or goals they have.
3. Based on that, recommend relevant Nio AI services.
4. Ask if they'd like to learn more about the solutions.
5. If yes, collect their name -> email -> phone number (one at a time).
6. Provide a more technical description of the solution and invite them to book a free consultation.
7. Finally, ask if they have any notes or questions before ending the chat.

OTHER RULES:
- Be friendly but concise.
- Do not ask multiple questions at once.
- Do not mention pricing unless asked.
- Stay on-topic and professional throughout the conversation.`
            },
            ...conversation
        ];

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 150,
            temperature: 0.7,
        });

        const botResponse = completion.choices[0].message.content;

        // Add bot response to conversation history
        conversation.push({ role: 'assistant', content: botResponse });

        // Keep conversation history manageable (limit to last 20 messages)
        if (conversation.length > 20) {
            conversation = conversation.slice(-20);
        }

        // Upsert conversation to Supabase
        const { error: upsertError } = await supabase
            .from('conversations')
            .upsert({
                conversation_id: sessionId,
                messages: conversation,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'conversation_id'
            });

        if (upsertError) {
            console.error('Supabase upsert error:', upsertError);
            return res.status(500).json({ 
                error: 'Failed to save conversation to database.' 
            });
        }

        res.json({
            response: botResponse,
            conversation: conversation
        });

    } catch (error) {
        console.error('Error processing chat:', error);
        
        if (error.code === 'insufficient_quota') {
            res.status(500).json({ 
                error: 'OpenAI API quota exceeded. Please check your API key and billing.' 
            });
        } else if (error.code === 'invalid_api_key') {
            res.status(500).json({ 
                error: 'Invalid OpenAI API key. Please check your environment variables.' 
            });
        } else {
            res.status(500).json({ 
                error: 'An error occurred while processing your request.',
                details: error.message 
            });
        }
    }
};
