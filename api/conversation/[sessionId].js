const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    try {
        if (req.method === 'GET') {
            // Get conversation history
            const { data: conversation, error } = await supabase
                .from('conversations')
                .select('messages')
                .eq('conversation_id', sessionId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Supabase fetch error:', error);
                return res.status(500).json({ error: 'Failed to fetch conversation.' });
            }

            res.json({ 
                conversation: conversation?.messages || [] 
            });

        } else if (req.method === 'DELETE') {
            // Delete conversation
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('conversation_id', sessionId);

            if (error) {
                console.error('Supabase delete error:', error);
                return res.status(500).json({ error: 'Failed to clear conversation.' });
            }

            res.json({ message: 'Conversation cleared successfully' });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('Error processing conversation request:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
};
