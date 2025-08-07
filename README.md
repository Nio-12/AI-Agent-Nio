# NiO - AI Chatbot

A modern, responsive chatbot interface with a sleek black background design.

## Features

- **Modern UI**: Clean, dark theme with gradient accents
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Chat**: Instant message sending and receiving
- **Typing Indicators**: Visual feedback when the bot is "thinking"
- **Fixed Responses**: Pre-programmed responses for common queries
- **Smooth Animations**: Fade-in effects and hover animations

## How to Use

1. **Open the Website**: Simply open `index.html` in your web browser
2. **Start Chatting**: Type your message in the input field and press Enter or click the send button
3. **Get Responses**: NiO will respond with relevant information based on your message

## Supported Commands

The chatbot can respond to various types of messages:

### Greetings
- "Hello"
- "Hi"
- "Hey"

### Help Requests
- "Help"
- "Can you assist me?"
- "I need support"

### Time & Date
- "What time is it?"
- "What's the date today?"
- "Tell me the time"

### Weather (Informational)
- "What's the weather like?"
- "Weather forecast"

### General Questions
- "What's your name?"
- "Who are you?"
- "What can you do?"

### Polite Responses
- "Thank you"
- "Thanks"
- "Goodbye"
- "See you"

## File Structure

```
├── index.html      # Main HTML file
├── styles.css      # CSS styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Customization

### Adding New Responses

To add new responses, edit the `responses` object in `script.js`:

```javascript
this.responses = {
    newCategory: [
        "Response 1",
        "Response 2",
        "Response 3"
    ],
    // ... existing categories
};
```

### Changing Colors

Modify the CSS variables in `styles.css` to change the color scheme:

```css
/* Primary accent color */
--primary-color: #00d4ff;

/* Background colors */
--bg-primary: #000000;
--bg-secondary: #1a1a1a;
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Technologies Used

- **HTML5**: Structure and semantics
- **CSS3**: Styling and animations
- **JavaScript (ES6+)**: Functionality and interactions
- **Font Awesome**: Icons

## Future Enhancements

- Integration with real AI APIs
- Voice recognition
- File sharing capabilities
- Multi-language support
- User authentication
- Chat history persistence

---

**NiO** - Your AI Assistant 🤖
