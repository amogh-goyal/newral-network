# Map-It: Personalized Learning Roadmap Generator

## Overview

Map-It is a full-stack web application developed for the **Google Developer Groups 2025 Solution Challenge**, addressing **Uneven Access to Quality Education in the Digital Age**. It empowers users to master new skills by generating personalized learning roadmaps tailored to their desired profession or skill, considering factors like region, language, and cost. By leveraging AI-driven course aggregation, community collaboration, and progress tracking, Map-It democratizes education and supports learners globally.

## Features

- **AI-Powered Roadmaps**: Uses Gemini AI to generate customized learning paths based on user inputs (profession, skill level, region, language, and budget)
- **Multi-Platform Resource Aggregation**: Curates courses from platforms like Udemy, Khan Academy, and YouTube using Playwright and the YouTube Data API
- **Community Collaboration**: Enables users to create and share public roadmaps for specific fields or company interview preparation
- **Progress Tracking**: Monitors learning milestones to keep users motivated and on track
- **AI Chatbot**: Provides real-time educational support and guidance
- **Internationalization**: Adapts roadmaps to region-specific and language-specific resources for global accessibility
- **Responsive Design**: Ensures seamless user experience across devices with React and Vite

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Framer Motion
- React Router

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- JWT
- Zod

### AI Service
- FastAPI
- Python
- Gemini AI
- Playwright
- YouTube Data API

### Tools
- Git
- Agile methodologies

## Installation

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud instance)
- API keys for Gemini AI and YouTube Data API

### Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-repo/map-it.git
   cd map-it
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   
   Update `.env` with MongoDB URI, JWT secret, Gemini AI key, and YouTube API key.
   
   Run the server:
   ```bash
   npm start
   ```

3. **AI Service Setup:**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   cp .env.example .env
   ```
   
   Update `.env` with Gemini AI and YouTube API keys.
   
   Run the FastAPI server:
   ```bash
   uvicorn api:app --reload
   ```

4. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
   Access the app at `http://localhost:5173`

## Usage

- **Create a Roadmap**: Sign up, input your desired profession or skill, and specify preferences (region, language, budget). The AI generates a tailored roadmap with curated resources
- **Track Progress**: Use the progress dashboard to monitor completed courses and milestones
- **Share Roadmaps**: Publish your roadmap to the community for others to use or adapt
- **Chat Support**: Interact with the AI chatbot for learning guidance or resource clarification

## Project Structure

```
map-it/
├── backend/                # Node.js/Express server
│   ├── index.js            # Main server file with RESTful APIs
│   ├── routes/             # API routes for authentication, roadmaps, etc.
│   └── models/             # Mongoose schemas
├── ai-service/             # FastAPI service for AI and scraping
│   ├── api.py              # FastAPI server
│   ├── topic_generator.py  # Gemini AI for roadmap generation
│   ├── course_selector.py  # Course selection logic
│   ├── web_scraper.py      # Playwright for resource scraping
│   └── youtube_api.py      # YouTube Data API integration
├── frontend/               # React/Vite frontend
│   ├── src/
│   │   ├── App.jsx         # Main app component
│   │   ├── create-roadmap.jsx  # Roadmap creation component
│   │   ├── roadmaps.jsx    # Roadmap viewing component
│   │   ├── progress.jsx    # Progress tracking component
│   │   ├── bot.jsx         # AI chatbot component
│   │   └── sample-roadmap.jsx  # Community roadmap component
└── README.md               # Project documentation
```

## Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m "Add YourFeature"`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request with a clear description of your changes

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built for the **Google Developer Groups 2025 Solution Challenge**
- Thanks to the team for collaboration and to the open-source community for tools like React, FastAPI, and Playwright
