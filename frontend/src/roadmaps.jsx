import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { 
  FaArrowRight, FaStar, FaEye, FaCheck, FaChevronLeft, 
  FaChevronRight, FaExternalLinkAlt, FaSpinner, FaTrash 
} from "react-icons/fa";
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

export function RoadmapsList() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/signin');
          return;
        }

        const response = await fetch('http://localhost:3001/roadmaps', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch roadmaps');
        }

        const data = await response.json();
        setRoadmaps(data.maps);
      } catch (err) {
        console.error('Error fetching roadmaps:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmaps();
  }, [navigate]);

  const handleRoadmapClick = (roadmapId) => {
    navigate(`/roadmaps/${roadmapId}`);
  };

  const handleDeleteRoadmap = async (e, roadmapId) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    
    if (window.confirm("Are you sure you want to delete this roadmap? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3001/roadmaps/${roadmapId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete roadmap');
        }

        // Remove the deleted roadmap from state
        setRoadmaps(roadmaps.filter(roadmap => roadmap.id !== roadmapId));
      } catch (err) {
        console.error('Error deleting roadmap:', err);
        alert(`Error deleting roadmap: ${err.message}`);
      }
    }
  };

  const toggleDescription = (e, roadmapId) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    setExpandedDescriptions(prev => ({
      ...prev,
      [roadmapId]: !prev[roadmapId]
    }));
  };

  const truncateDescription = (description, wordLimit = 20) => {
    if (!description) return '';
    
    const words = description.split(' ');
    if (words.length <= wordLimit) return description;
    
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
          <p className="text-xl">Loading your roadmaps...</p>
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
            <BiMap className="mr-2 text-blue-500" /> My Roadmaps
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
          {roadmaps.length === 0 ? (
            <div className="text-center p-10 bg-gray-800 bg-opacity-50 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">No Roadmaps Found</h2>
              <p className="text-gray-300 mb-6">You haven't created any roadmaps yet.</p>
              <button 
                onClick={() => navigate('/create-roadmap')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center justify-center gap-2 mx-auto"
              >
                Create Your First Roadmap
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {roadmaps.map((roadmap) => (
                <motion.div
                  key={roadmap.id}
                  variants={itemVariants}
                  className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <button 
                    onClick={() => handleRoadmapClick(roadmap.id)}
                    className="w-full text-left p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{roadmap.title}</h3>
                        <div className="text-gray-300 mb-3">
                          {expandedDescriptions[roadmap.id] 
                            ? roadmap.description 
                            : truncateDescription(roadmap.description)}
                          
                          {roadmap.description && roadmap.description.split(' ').length > 20 && (
                            <button 
                              onClick={(e) => toggleDescription(e, roadmap.id)}
                              className="ml-2 text-blue-400 hover:text-blue-300 transition text-sm font-medium"
                            >
                              {expandedDescriptions[roadmap.id] ? 'See less' : 'See more'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <span className="px-3 py-1 bg-gray-700 rounded-full mr-3">
                            {roadmap.topic}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={(e) => handleDeleteRoadmap(e, roadmap.id)}
                          className="text-gray-400 hover:text-red-500 transition p-2 mr-2"
                          aria-label="Delete roadmap"
                        >
                          <FaTrash />
                        </button>
                        <FaChevronRight className="text-2xl text-blue-500" />
                      </div>
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

export function RoadmapDetail() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/signin');
          return;
        }

        const response = await fetch(`http://localhost:3001/roadmaps/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch roadmap');
        }

        const data = await response.json();
        setRoadmap(data.roadmap);
        
        // Use the selected_option from the roadmap data
        if (data.roadmap.selected_option) {
          setSelectedOption(data.roadmap.selected_option);
        } else if (data.roadmap.options && data.roadmap.options.length > 0) {
          // Fallback to first option if no selected_option is set
          setSelectedOption(data.roadmap.options[0].option_id);
        }
      } catch (err) {
        console.error('Error fetching roadmap:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmap();
  }, [id, navigate]);

  const handleOptionChange = async (optionId) => {
    setSelectedOption(optionId);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/signin');
        return;
      }

      // Update the selected option in the database
      const response = await fetch(`http://localhost:3001/roadmaps/${id}/selected-option`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optionId })
      });

      if (!response.ok) {
        throw new Error('Failed to update selected option');
      }
      
      // Update local state to reflect the change
      setRoadmap(prevRoadmap => ({
        ...prevRoadmap,
        selected_option: optionId
      }));
      
    } catch (err) {
      console.error('Error updating selected option:', err);
      // You could add an error notification here
    }
  };

  const handleMarkAsDone = async (topicIndex) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/signin');
        return;
      }

      const option = roadmap.options.find(opt => opt.option_id === selectedOption);
      if (!option) return;

      const topic = option.topics[topicIndex];
      const newCompletedStatus = !topic.completed;

      const response = await fetch(`http://localhost:3001/roadmaps/${id}/option/${selectedOption}/topic/${topic.step_number}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: newCompletedStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update topic status');
      }

      // Update local state
      setRoadmap(prevRoadmap => {
        const updatedOptions = prevRoadmap.options.map(opt => {
          if (opt.option_id === selectedOption) {
            const updatedTopics = [...opt.topics];
            updatedTopics[topicIndex].completed = newCompletedStatus;
            return { ...opt, topics: updatedTopics };
          }
          return opt;
        });
        return { ...prevRoadmap, options: updatedOptions };
      });
    } catch (err) {
      console.error('Error updating topic status:', err);
      // Show error toast or notification here
    }
  };

  // Calculate average ratings for the selected option
  const calculateAverageRating = () => {
    if (!roadmap || !selectedOption) return { avgRating: 0, avgReviews: 0 };
    
    const option = roadmap.options.find(opt => opt.option_id === selectedOption);
    if (!option) return { avgRating: 0, avgReviews: 0 };
    
    let totalRating = 0;
    let totalReviews = 0;
    let count = 0;
    
    option.topics.forEach(topic => {
      totalRating += topic.rating || 0;
      totalReviews += topic.reviews_count || 0;
      count++;
    });
    
    return {
      avgRating: count > 0 ? (totalRating / count).toFixed(1) : 0,
      avgReviews: count > 0 ? Math.round(totalReviews / count) : 0
    };
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
          <p className="text-xl">Loading roadmap...</p>
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
            onClick={() => navigate('/roadmaps')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Back to Roadmaps
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
        <div className="text-center max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Roadmap Not Found</h2>
          <p className="mb-6">The roadmap you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/roadmaps')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Back to Roadmaps
          </button>
        </div>
      </div>
    );
  }

  const { avgRating, avgReviews } = calculateAverageRating();
  const selectedOptionData = roadmap.options.find(opt => opt.option_id === selectedOption);
  const sortedTopics = selectedOptionData ? 
    [...selectedOptionData.topics].sort((a, b) => a.step_number - b.step_number) : [];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-gray-900 bg-opacity-90 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/roadmaps')}
            className="text-xl hover:text-blue-400 transition mr-4"
            aria-label="Back to roadmaps"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-xl font-bold tracking-wide flex items-center truncate">
            <BiMap className="mr-2 text-blue-500 flex-shrink-0" /> 
            <span className="truncate">{roadmap.title}</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto pt-28 px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Roadmap Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-bold mb-4">{roadmap.title}</h1>
            <p className="text-gray-300 mb-6">{roadmap.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-4 py-2 bg-gray-800 rounded-lg text-blue-400 font-medium">
                {roadmap.topic}
              </span>
              <div className="flex items-center ml-auto">
                <div className="flex items-center mr-6">
                  <FaStar className="text-yellow-400 mr-2" />
                  <span>{avgRating}</span>
                </div>
                <div className="flex items-center">
                  <FaEye className="text-gray-400 mr-2" />
                  <span>{avgReviews} reviews</span>
                </div>
              </div>
            </div>
            
            {/* Options Selector */}
            {roadmap.options.length > 1 && (
              <div className="mb-10">
                <h3 className="text-lg font-semibold mb-3">Roadmap Options:</h3>
                <div className="flex flex-wrap gap-3">
                  {roadmap.options.map(option => (
                    <button
                      key={option.option_id}
                      onClick={() => handleOptionChange(option.option_id)}
                      className={`px-4 py-2 rounded-lg transition ${
                        selectedOption === option.option_id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {option.option_name}
                      {selectedOption === option.option_id && (
                        <span className="ml-2 text-xs bg-blue-700 px-2 py-1 rounded-full">Selected</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Select an option to change your learning path. Your progress will be tracked for the selected option.
                </p>
              </div>
            )}
          </motion.div>

          {/* Roadmap Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {sortedTopics.map((topic, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">
                      Step {topic.step_number}: {topic.topic}
                    </h3>
                    <button
                      onClick={() => handleMarkAsDone(index)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                        topic.completed
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {topic.completed ? (
                        <>
                          <FaCheck /> Completed
                        </>
                      ) : (
                        'Mark as Done'
                      )}
                    </button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <img
                        src={topic.thumbnail}
                        alt={topic.topic}
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    </div>
                    
                    <div className="md:w-2/3">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center">
                          <FaStar className="text-yellow-400 mr-1" />
                          <span>{topic.rating}</span>
                        </div>
                        <div className="flex items-center">
                          <FaEye className="text-gray-400 mr-1" />
                          <span>{topic.reviews_count} reviews</span>
                        </div>
                      </div>
                      
                      <a
                        href={topic.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                      >
                        Go to Course <FaExternalLinkAlt />
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Arrow connecting to next step */}
                {index < sortedTopics.length - 1 && (
                  <div className="flex justify-center my-4">
                    <FaArrowRight className="text-2xl text-blue-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default RoadmapsList;
