import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaTrash, FaHome } from "react-icons/fa";
import "./ChatbotUI.css"; 
import { FASTAPI_URL } from './config.js';

// Code Block Component with Improved Formatting
const CodeBlock = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  // Function to properly indent code
  const formatCode = (rawCode) => {
    // Remove leading and trailing whitespace
    const lines = rawCode.split('\n');
    
    // Find the minimum indentation
    const minIndent = lines
      .filter(line => line.trim() !== '')
      .reduce((min, line) => {
        const indent = line.match(/^\s*/)[0].length;
        return Math.min(min, indent);
      }, Infinity);
    
    // Remove the minimum indentation from each line
    return lines
      .map(line => line.slice(minIndent))
      .join('\n');
  };
  
  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-language">{language || 'CODE'}</span>
        <button className="copy-button" onClick={handleCopy}>
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="code-block-content">{formatCode(code)}</pre>
    </div>
  );
};

const ChatbotUI = () => {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hi there! I'm your Educational Roadmap Assistant. How can I help in your learning journey today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatboxRef = useRef(null);
  const textareaRef = useRef(null);

  // Dynamic textarea resizing
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to correctly calculate scrollHeight
      textarea.style.height = 'auto';
      
      // Set height based on content, with min and max limits
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 40), 200)}px`;
    }
  }, [input]);

  // Scroll to bottom of chatbox when messages change
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  // Function to extract code blocks from text
  const extractCodeBlocks = (text) => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return parts;
  };

  // Function to convert text with stars and hashtags to HTML
  const convertToHTML = (text) => {
    if (!text) return text;
    
    // Process the text in steps to handle complex cases
    let processedText = text;
    
    // Handle triple stars (bold italics) - must be processed first
    processedText = processedText.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    
    // Handle double stars (bold)
    processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle single star within a word like "word*s*" - likely intended as italics
    processedText = processedText.replace(/\b(\w*)\*(\w+)\*(\w*)\b/g, '$1<em>$2</em>$3');
    
    // Handle standard single stars for italics
    processedText = processedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Handle underscores for italics
    processedText = processedText.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Handle double underscores for bold
    processedText = processedText.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Handle hashtags for headers (h1-h6)
    processedText = processedText.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
    processedText = processedText.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
    processedText = processedText.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
    processedText = processedText.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
    processedText = processedText.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
    processedText = processedText.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Handle bullet points that start with asterisk
    processedText = processedText.replace(/^\s*\*\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap sequences of <li> elements with <ul> tags
    let inList = false;
    const lines = processedText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<li>') && !inList) {
        lines[i] = '<ul>' + lines[i];
        inList = true;
      } else if (!lines[i].includes('<li>') && inList) {
        lines[i-1] = lines[i-1] + '</ul>';
        inList = false;
      }
    }
    if (inList) {
      lines[lines.length-1] = lines[lines.length-1] + '</ul>';
    }
    
    processedText = lines.join('\n');
    
    // Handle numbered lists
    processedText = processedText.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
    
    // Replace double newlines with paragraph breaks
    processedText = processedText.replace(/\n\n/g, '</p><p>');
    
    // Wrap in paragraph tags if not already wrapped
    if (!processedText.startsWith('<p>') && 
        !processedText.startsWith('<h') && 
        !processedText.startsWith('<ul') && 
        !processedText.startsWith('<ol')) {
      processedText = '<p>' + processedText;
    }
    
    if (!processedText.endsWith('</p>') && 
        !processedText.endsWith('</h1>') && 
        !processedText.endsWith('</h2>') && 
        !processedText.endsWith('</h3>') && 
        !processedText.endsWith('</h4>') && 
        !processedText.endsWith('</h5>') && 
        !processedText.endsWith('</h6>') && 
        !processedText.endsWith('</ul>') && 
        !processedText.endsWith('</ol>')) {
      processedText = processedText + '</p>';
    }
    
    // Handle inline code with backticks (but not triple backticks for code blocks)
    processedText = processedText.replace(/`([^`\n]+)`/g, '<span class="inline-code">$1</span>');
    
    return processedText;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    setMessages([...messages, { role: "user", content: input }]);
    setIsLoading(true);
    
    try {
      // Make API call to backend
      const response = await fetch(`${FASTAPI_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      
      // Save conversation ID for future messages
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      // Extract code blocks and process the rest as HTML
      const parts = extractCodeBlocks(data.content);
      
      // Add assistant response to chat
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: parts.map((part, i) => 
            part.type === 'text' ? convertToHTML(part.content) : part
          ),
          isProcessed: true,
          rawContent: data.content 
        }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error message to user
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again later." }
      ]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleClearChat = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${FASTAPI_URL}/clear`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to clear chat");
      }
      
      const data = await response.json();
      setConversationId(data.conversation_id);
      
      setMessages([
        { role: "assistant", content: "Chat cleared! Start a new conversation." }
      ]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render message content based on format
  const renderMessageContent = (message) => {
    if (!message.isProcessed) {
      return <div className="message-content" dangerouslySetInnerHTML={{ __html: message.content }} />;
    }
    
    return (
      <div className="message-content">
        {message.content.map((part, index) => {
          if (part.type === 'code') {
            return <CodeBlock key={index} code={part.content} language={part.language} />;
          } else {
            return (
              <div 
                key={index} 
                dangerouslySetInnerHTML={{ __html: part }} 
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="main-container">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="chatbot-logo">
            <img src="/image.png" alt="Chatbot Logo" />
          </div>
          <div className="chatbot-heading">
            <h2>Cartographer AI</h2>
          </div>
        </div>
        <button className="home-button" onClick={() => window.location.href = "/home"}>
          <FaHome /> Back to Home
        </button>
      </div>

      {/* Chatbox */}
      <div className="chatbox" ref={chatboxRef}>
        {messages.map((msg, index) => (
          <div key={index} className={msg.role === "user" ? "user-message" : "custom-message"}>
            {msg.role === "assistant" ? (
              renderMessageContent(msg)
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="custom-message">
            <p>Thinking...</p>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="chat-input">
        <textarea
          ref={textareaRef}
          className="search-bar"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows="1"
          disabled={isLoading}
          style={{ 
            resize: 'none',  // Prevent manual resizing
            overflow: 'hidden'  // Hide scrollbar
          }}
        />
        <button 
          id="send-button" 
          onClick={handleSendMessage} 
          disabled={isLoading || !input.trim()}
        >
          <FaPaperPlane />
        </button>
        <button 
          id="clear-button" 
          onClick={handleClearChat}
          disabled={isLoading}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default ChatbotUI;