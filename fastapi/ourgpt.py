from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import logging
from typing import List, Dict, Optional
import uuid
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI router
router = APIRouter()

# Try to import Google Generative AI
try:
    import google.generativeai as genai
    from dotenv import load_dotenv
    import os
    
    # Load environment variables and configure Gemini API
    load_dotenv()
    API_KEY = os.getenv("OUR_KEY")
    if not API_KEY:
        logger.warning("OUR_KEY environment variable not found. Using hardcoded fallback key.")
        API_KEY = "AIzaSyDlNNKn-sCszfrlhANljr6hAOnFSU4AjLM"
    
    genai.configure(api_key=API_KEY)
    GEMINI_AVAILABLE = True
except ImportError:
    logger.warning("Google Generative AI package not available. Chatbot will use fallback responses.")
    GEMINI_AVAILABLE = False

# In-memory storage for conversations (replace with database in production)
conversations: Dict[str, Dict] = {}

# Define request models to match React frontend
class Message(BaseModel):
    role: str  # "user" or "assistant" (matching React component)
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    role: str
    content: str
    conversation_id: str

# System prompt with context about the chatbot
SYSTEM_PROMPT = """
Your primary purpose is to solve educational doubts for students. Be helpful, informative, and adapt your explanations 
to the user's academic level. Always provide accurate information and encourage critical thinking.

When explaining concepts, use examples and analogies to help students understand better. If you don't know the 
answer to a question, admit it rather than providing incorrect information.

Always make sure to give the answer in a structured manner , and Markdown the given text.

Whenever you return structured text , add a fair amount of spaces between two lines of different concepts making it visually easy to understand
the different topics.

whenever you return code , make sure it clearly mentions that indentation might not appear to be correct but will
work correctly if copy function is used.

"""

# Helper functions
def get_or_create_conversation(conversation_id: Optional[str] = None) -> str:
    """Get existing conversation or create a new one"""
    if conversation_id and conversation_id in conversations:
        return conversation_id
    
    new_id = str(uuid.uuid4())
    conversations[new_id] = {
        "messages": [
            {
                "role": "assistant",
                "content": "Hi there! I'm your Educational Roadmap Assistant. How can I help in your learning journey today?"
            }
        ],
        "created_at": datetime.now().isoformat(),
    }
    return new_id

def format_message_history(messages: List[Dict]) -> List[Dict]:
    """Format messages for Gemini API"""
    formatted = []
    for message in messages:
        # Map 'assistant' to 'model' for Gemini API
        if message["role"] == "assistant":
            formatted.append({"role": "model", "parts": [message["content"]]})
        else:
            formatted.append({"role": "user", "parts": [message["content"]]})
    return formatted

# API endpoints
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get or create conversation
        conversation_id = get_or_create_conversation(request.conversation_id)
        
        # Get conversation history
        history = conversations[conversation_id]["messages"]
        
        # Record user message
        user_message = {
            "role": "user",
            "content": request.message
        }
        history.append(user_message)
        
        # Process with history
        if GEMINI_AVAILABLE:
            try:
                model = genai.GenerativeModel("gemini-1.5-pro")
                
                if len(history) <= 2:  # First user message (after initial bot greeting)
                    # Use system prompt for first message
                    prompt = f"{SYSTEM_PROMPT}\n\nUser query: {request.message}"
                    response = model.generate_content(prompt)
                    bot_content = response.text
                else:
                    # Use conversation history - limit to last 10 messages to avoid context length issues
                    limited_history = history[-10:-1] if len(history) > 10 else history[:-1]
                    chat = model.start_chat(history=format_message_history(limited_history))
                    response = chat.send_message(request.message)
                    bot_content = response.text
            except Exception as api_error:
                logger.error(f"Gemini API error: {str(api_error)}")
                # Fallback response in case of API error
                bot_content = "I'm having trouble connecting to my knowledge base right now. Could you try asking your question again in a moment?"
        else:
            # Fallback responses when Gemini is not available
            bot_content = f"I understand you're asking about '{request.message}'. However, I'm currently running in fallback mode without access to my full knowledge base. Please ensure the Google Generative AI package is properly installed."
        
        # Record bot response
        bot_message = {
            "role": "assistant",
            "content": bot_content
        }
        
        history.append(bot_message)
        
        # Return response that matches frontend expectations
        return {
            "role": "assistant",
            "content": bot_message["content"],
            "conversation_id": conversation_id
        }
    except Exception as e:
        logger.exception(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str):
    """Retrieve message history for a conversation"""
    try:
        if conversation_id not in conversations:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {
            "messages": conversations[conversation_id]["messages"],
            "conversation_id": conversation_id
        }
    except Exception as e:
        logger.exception(f"Error retrieving messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clear")
async def clear_chat():
    """Clear chat and start a new conversation"""
    try:
        conversation_id = str(uuid.uuid4())
        conversations[conversation_id] = {
            "messages": [
                {
                    "role": "assistant", 
                    "content": "Chat cleared! Start a new conversation."
                }
            ],
            "created_at": datetime.now().isoformat(),
        }
        
        return {
            "conversation_id": conversation_id,
            "message": "Chat cleared successfully"
        }
    except Exception as e:
        logger.exception(f"Error clearing chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file uploads"""
    try:
        content = await file.read()
        # Process file contents - this is where you'd implement file analysis
        # For now, just return a confirmation
        return {
            "filename": file.filename,
            "message": "File received. I can analyze educational content from this file."
        }
    except Exception as e:
        logger.exception(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    return {"status": "ok", "message": "Educational Roadmap Assistant API is running", "gemini_available": GEMINI_AVAILABLE}