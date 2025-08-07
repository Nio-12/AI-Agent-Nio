const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // First, try to get all columns including the new customer analysis columns
        let { data: conversations, error } = await supabase
            .from('conversations')
            .select('id, conversation_id, created_at, messages, customerName, customerEmail, customerPhone, customerIndustry, customerProblem, customerAvailability, customerConsultation, specialNotes, leadQuality, analyzed_at')
            .order('created_at', { ascending: false });

        // If that fails, fall back to basic columns
        if (error && error.code === '42703') { // Column doesn't exist
            console.log('New columns not found, using basic columns');
            const { data: basicConversations, error: basicError } = await supabase
                .from('conversations')
                .select('id, conversation_id, created_at, messages')
                .order('created_at', { ascending: false });

            if (basicError) {
                console.error('Supabase fetch error:', basicError);
                return res.status(500).json({ error: 'Failed to fetch conversations.' });
            }

            conversations = basicConversations;
        } else if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch conversations.' });
        }

        res.json({ 
            conversations: conversations || [] 
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'An error occurred while fetching conversations.' });
    }
};
