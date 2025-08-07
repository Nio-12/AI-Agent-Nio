# AI Chatbot with OpenAI Integration

A modern web chatbot that connects to OpenAI's API for intelligent responses. Built with HTML, CSS, JavaScript frontend and Node.js backend.

## 🚀 Features

- **Real AI Responses**: Powered by OpenAI GPT-3.5-turbo
- **Conversation Memory**: Maintains context across messages
- **Modern UI**: Beautiful, responsive design
- **Session Management**: Unique conversation sessions
- **Error Handling**: Graceful error handling for API issues
- **Typing Indicators**: Real-time typing animations

## 📁 Project Structure

```
AI-Agent-Nio/
├── index.html          # Frontend HTML
├── styles.css          # Frontend CSS
├── script.js           # Frontend JavaScript
├── server.js           # Node.js backend
├── package.json        # Node.js dependencies
├── env.example         # Environment variables template
└── README.md          # This file
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy the environment template:
```bash
cp env.example .env
```

2. Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
PORT=3000
```

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 5. Access the Application

Open your browser and go to: `http://localhost:3001`

## 🔧 API Endpoints

- `POST /api/chat` - Send a message and get AI response
- `GET /api/conversation/:sessionId` - Get conversation history
- `DELETE /api/conversation/:sessionId` - Clear conversation
- `GET /api/health` - Health check

## 💾 Conversation Storage

- Conversations are stored in memory (Map object)
- Each session has a unique ID
- Conversation history is limited to 20 messages
- Sessions persist until server restart

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Gradient backgrounds and smooth animations
- **Real-time Typing**: Animated typing indicators
- **Auto-scroll**: Automatically scrolls to new messages
- **Error Handling**: User-friendly error messages

## 🔒 Security Notes

- API key is stored in `.env` file (not committed to git)
- CORS enabled for local development
- Input validation on both frontend and backend
- Error messages don't expose sensitive information

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API Key" Error**
   - Check your `.env` file
   - Verify your OpenAI API key is correct
   - Ensure you have billing set up on OpenAI

2. **"Quota Exceeded" Error**
   - Check your OpenAI billing
   - Monitor your API usage

3. **Server Won't Start**
   - Make sure all dependencies are installed: `npm install`
       - Check if port 3001 is available
   - Verify `.env` file exists

4. **Frontend Can't Connect**
       - Ensure server is running on port 3001
   - Check browser console for errors
   - Verify CORS settings

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `PORT` | Server port | 3001 |

## 🔄 Development

### Adding New Features:

1. **Modify Frontend**: Edit `script.js`, `styles.css`, or `index.html`
2. **Modify Backend**: Edit `server.js`
3. **Add Dependencies**: Update `package.json`

### Testing:

- Frontend: Open browser and test UI
- Backend: Use tools like Postman or curl
- API Health: Visit `http://localhost:3001/api/health`

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify your OpenAI API key
3. Check server logs for errors
4. Ensure all dependencies are installed

---

**Happy Chatting! 🤖✨**
