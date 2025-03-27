import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaChevronLeft, FaPlus, FaCheck, FaSpinner, 
  FaStar, FaEye, FaExternalLinkAlt, FaArrowRight 
} from "react-icons/fa";
import { BiMap } from "react-icons/bi";

export default function SampleRoadmapDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:3001/samples/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sample roadmap');
        }

        const data = await response.json();
        console.log('Sample roadmap data received:', data);
        
        if (data.roadmap) {
          setRoadmap(data.roadmap);
          
          // Access the roadmap data from the nested roadmap object
          const roadmapData = data.roadmap.roadmap;
          
          // Set the first option as selected by default
          if (roadmapData && roadmapData.options && roadmapData.options.length > 0) {
            console.log('Setting default option:', roadmapData.options[0].option_id);
            setSelectedOption(roadmapData.options[0].option_id);
          }
        } else {
          throw new Error('Invalid roadmap data structure');
        }
      } catch (err) {
        console.error('Error fetching sample roadmap:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmap();
  }, [id]);

  const handleOptionChange = (optionId) => {
    setSelectedOption(optionId);
  };

  const handleAddToMyRoadmaps = async () => {
    try {
      setIsAdding(true);
      setAddError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/signin');
        return;
      }

      console.log(`Attempting to add roadmap ${id} to user collection...`);
      
      const response = await fetch(`http://localhost:3001/samples/${id}/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Add roadmap response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add roadmap to your collection');
      }

      const data = await response.json();
      console.log('Add roadmap success:', data);
      setAddSuccess(true);
      
      // Redirect to the newly created roadmap after a short delay
      setTimeout(() => {
        navigate(`/roadmaps/${data.roadmapId}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error adding roadmap to collection:', err);
      setAddError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
          <p className="text-xl">Loading sample roadmap...</p>
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

  if (!roadmap) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
        <div className="text-center max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Roadmap Not Found</h2>
          <p className="mb-6">The sample roadmap you're looking for doesn't exist or has been removed.</p>
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

  // Access the nested roadmap data
  const roadmapData = roadmap.roadmap || {};
  
  // Get the selected option data
  const selectedOptionData = roadmapData.options && roadmapData.options.length > 0 
    ? roadmapData.options.find(opt => opt.option_id === selectedOption) || roadmapData.options[0]
    : null;
  
  // Sort topics by step number if available
  const sortedTopics = selectedOptionData && selectedOptionData.topics ? 
    [...selectedOptionData.topics].sort((a, b) => 
      (a.step_number || 0) - (b.step_number || 0)
    ) : [];

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
          <h1 className="text-xl font-bold tracking-wide flex items-center truncate">
            <BiMap className="mr-2 text-blue-500 flex-shrink-0" /> 
            <span className="truncate">{roadmapData.title}</span>
          </h1>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-2 rounded-lg flex items-center justify-center transition ${
            addSuccess 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleAddToMyRoadmaps}
          disabled={isAdding || addSuccess}
        >
          {isAdding ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : addSuccess ? (
            <FaCheck className="mr-2" />
          ) : (
            <FaPlus className="mr-2" />
          )}
          {addSuccess ? 'Added to Your Roadmaps' : 'Add to My Roadmaps'}
        </motion.button>
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
            <h1 className="text-4xl font-bold mb-4">{roadmapData.title}</h1>
            <p className="text-gray-300 mb-6">{roadmapData.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-4 py-2 bg-gray-800 rounded-lg text-blue-400 font-medium">
                {roadmapData.topic}
              </span>
              <div className="flex items-center ml-auto">
                <div className="flex items-center mr-6">
                  <FaStar className="text-yellow-400 mr-2" />
                  <span>{roadmapData.rating || 4.5}</span>
                </div>
                <div className="flex items-center">
                  <FaEye className="text-gray-400 mr-2" />
                  <span>{roadmap.enrolled || 0} enrolled</span>
                </div>
              </div>
            </div>
            
            {addError && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
                {addError}
              </div>
            )}
            
            {/* Options Selector */}
            {roadmapData.options && roadmapData.options.length > 1 && (
              <div className="mb-10">
                <h3 className="text-lg font-semibold mb-3">Roadmap Options:</h3>
                <div className="flex flex-wrap gap-3">
                  {roadmapData.options.map(option => (
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
                  Select an option to view different learning paths.
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
            {sortedTopics.length > 0 ? (
              sortedTopics.map((topic, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative"
                >
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">
                        Step {index + 1}: {topic.title}
                      </h3>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {topic.thumbnail && (
                        <div className="md:w-1/3">
                          <img
                            src={topic.thumbnail}
                            alt={topic.title}
                            className="w-full h-auto rounded-lg object-cover"
                            onError={(e) => {
                              console.log("Image failed to load:", topic.thumbnail);
                              e.target.src = "/api/placeholder/400/250";
                            }}
                          />
                        </div>
                      )}
                      
                      <div className={topic.thumbnail ? "md:w-2/3" : "w-full"}>
                        <p className="text-gray-300 mb-4">{topic.description}</p>
                        
                        {topic.resources && topic.resources.length > 0 && (
                          <div className="mt-4 mb-6">
                            <h4 className="text-lg font-semibold mb-2">Resources</h4>
                            <ul className="space-y-2">
                              {topic.resources.map((resource, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-blue-400 mr-2">•</span>
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 hover:underline flex items-center"
                                  >
                                    {resource.title} <FaExternalLinkAlt className="ml-1 text-xs" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {topic.url && (
                          <a
                            href={topic.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                          >
                            Go to Course <FaExternalLinkAlt />
                          </a>
                        )}
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
              ))
            ) : (
              <div className="text-center py-10 bg-gray-800 bg-opacity-50 rounded-xl">
                <p className="text-gray-400">No topics available for this learning path.</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
