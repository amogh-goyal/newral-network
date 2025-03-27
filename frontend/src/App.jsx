import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./landing.jsx";
import Signup from "./signup.jsx";
import Home from './home.jsx';
import { RoadmapsList, RoadmapDetail } from './roadmaps.jsx';
import Progress from './progress.jsx';
import CreateRoadmap from './create-roadmap.jsx';
import ChatbotUI from './bot.jsx';
import SampleRoadmapDetail from './sample-roadmap.jsx';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/roadmaps" element={<RoadmapsList />} />
            <Route path="/roadmaps/:id" element={<RoadmapDetail />} />
            <Route path="/sample-roadmap/:id" element={<SampleRoadmapDetail />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/create-roadmap" element={<CreateRoadmap />} />
            <Route path="/chatbot" element={<ChatbotUI />} />
        </Routes>
    );
}
