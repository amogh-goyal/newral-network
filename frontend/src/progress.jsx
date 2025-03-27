import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { BiMap } from "react-icons/bi";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export function Progress() {
  const [progress, setProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/signin');
          return;
        }

        console.log('Fetching progress data with token:', token.substring(0, 10) + '...');
        
        // First test the server connection
        try {
          const testResponse = await fetch('http://localhost:3001/test');
          const testData = await testResponse.json();
          console.log('Test endpoint response:', testData);
        } catch (testErr) {
          console.error('Test endpoint failed:', testErr);
        }

        // Try the test progress endpoint
        try {
          console.log('Trying test progress endpoint...');
          const testProgressResponse = await fetch('http://localhost:3001/roadmaps/progress-test');
          const testProgressData = await testProgressResponse.json();
          console.log('Test progress endpoint response:', testProgressData);
        } catch (testProgressErr) {
          console.error('Test progress endpoint failed:', testProgressErr);
        }

        // Note: We're no longer using the debug endpoint by default
        // We'll only use it as a fallback if the authenticated endpoint fails

        const response = await fetch('http://localhost:3001/roadmaps/progress', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Progress response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch progress data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Progress data received:', data);
        setProgress(data.progress || []);
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [navigate]);

  const handleRoadmapClick = (roadmapId) => {
    navigate(`/roadmaps/${roadmapId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
          <p className="text-xl">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
        <div className="text-center max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => navigate('/home')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall progress
  const totalRoadmaps = progress.length;
  const completedRoadmaps = progress.filter(item => item.percentage === 100).length;
  const overallPercentage = totalRoadmaps > 0 
    ? Math.round((progress.reduce((sum, item) => sum + item.percentage, 0) / totalRoadmaps)) 
    : 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-gray-900 bg-opacity-90 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/home')}
            className="text-xl hover:text-blue-400 transition mr-4"
            aria-label="Back to home"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-2xl font-bold tracking-wide uppercase flex items-center">
            <BiMap className="mr-2 text-blue-500" /> My Progress
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto pt-28 px-6 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Overall Progress Card */}
          <motion.div
            variants={itemVariants}
            className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Overall Progress</h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-6 mb-2">
                  <div 
                    className="bg-blue-600 h-6 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${overallPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>0%</span>
                  <span>{overallPercentage}% Complete</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-blue-500">{totalRoadmaps}</p>
                  <p className="text-gray-400">Total Roadmaps</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">{completedRoadmaps}</p>
                  <p className="text-gray-400">Completed</p>
                </div>
              </div>
            </div>
          </motion.div>

          {progress.length === 0 ? (
            <div className="text-center p-10 bg-gray-800 bg-opacity-50 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">No Progress Yet</h2>
              <p className="text-gray-300 mb-6">You haven't started any roadmaps yet.</p>
              <button 
                onClick={() => navigate('/roadmaps')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center justify-center gap-2 mx-auto"
              >
                View Your Roadmaps
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {progress.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <button 
                    onClick={() => handleRoadmapClick(item.id)}
                    className="w-full text-left p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{item.title}</h3>
                        <p className="text-gray-400 mb-2">Topic: {item.topic}</p>
                        <div className="flex items-center text-sm text-gray-300 mb-3">
                          <span className="px-3 py-1 bg-gray-700 rounded-full">
                            Option: {item.option_name}
                          </span>
                        </div>
                      </div>
                      {item.percentage === 100 && (
                        <div className="bg-green-600 text-white p-2 rounded-full">
                          <FaCheckCircle size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm font-medium text-blue-400">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            item.percentage === 100 
                              ? 'bg-green-600' 
                              : item.percentage > 50 
                                ? 'bg-blue-600' 
                                : 'bg-yellow-600'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-400 mt-4">
                      <span>{item.completed} of {item.total} topics completed</span>
                      <span>Click to view details</span>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default Progress;
