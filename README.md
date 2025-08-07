# NiO AI Chatbot

A modern AI chatbot powered by OpenAI's GPT-3.5-turbo model with a beautiful, responsive web interface.

## Features

- 🤖 **AI-Powered Responses**: Uses OpenAI's GPT-3.5-turbo for intelligent conversations
- 💬 **Conversation Memory**: Maintains conversation history for context-aware responses
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- ⚡ **Real-time Chat**: Instant messaging with typing indicators
- 🔒 **Session Management**: Unique session IDs for conversation tracking
- 🌐 **RESTful API**: Clean API endpoints for easy integration

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key

### Installation

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure OpenAI API Key**
   
   Edit the `.env` file and replace `your_openai_api_key_here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=3000
   ```

   **Important**: Never commit your API key to version control!

4. **Start the server**
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open your browser and navigate to: `http://localhost:3000`

## API Endpoints

### POST `/api/chat`
Send a message to the chatbot.

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing great, thank you for asking. How can I help you today?",
  "sessionId": "session_1234567890_abc123",
  "conversationLength": 2
}
```

### GET `/api/conversation/:sessionId`
Get conversation history for a specific session.

### DELETE `/api/conversation/:sessionId`
Clear conversation history for a specific session.

### GET `/api/health`
Health check endpoint.

## Project Structure

```
├── server.js          # Main Node.js server
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (API keys)
├── index.html        # Frontend HTML
├── script.js         # Frontend JavaScript
├── styles.css        # Frontend styling
└── README.md         # This file
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Server port (default: 3000)

## Features in Detail

### Conversation Memory
The chatbot maintains conversation history in memory, allowing it to remember previous messages and provide context-aware responses. Each session has a unique ID, and conversations are limited to the last 20 messages to prevent context overflow.

### Error Handling
The application includes comprehensive error handling for:
- Invalid API keys
- API quota exceeded
- Network connectivity issues
- Server errors

### Security
- API keys are stored in environment variables
- CORS is enabled for cross-origin requests
- Input validation on all endpoints

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your OpenAI API key is correctly set in the `.env` file
   - Ensure the API key is valid and has sufficient credits

2. **"API quota exceeded" error**
   - Check your OpenAI account balance
   - Consider upgrading your OpenAI plan

3. **Server won't start**
   - Ensure Node.js is installed (v14 or higher)
   - Check that all dependencies are installed (`npm install`)
   - Verify the port isn't already in use

4. **Frontend can't connect to backend**
   - Ensure the server is running on the correct port
   - Check browser console for CORS errors
   - Verify the API endpoints are accessible

## Development

### Adding New Features

1. **New API endpoints**: Add routes to `server.js`
2. **Frontend changes**: Modify `script.js` and `styles.css`
3. **Styling updates**: Edit `styles.css`

### Testing

Test the API endpoints using tools like:
- Postman
- curl
- Browser developer tools

Example curl command:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This application uses OpenAI's API, which may incur costs depending on your usage. Please monitor your OpenAI account usage and costs.
