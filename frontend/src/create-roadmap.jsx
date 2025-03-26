import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { BiMap } from "react-icons/bi";

export default function CreateRoadmap() {
    const [formData, setFormData] = useState({
        degree: "",
        country: "",
        language: "",
        isPaidCourse: "",
        preferredLanguage: ""
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    
    const handleRadioChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/signin';
                return;
            }
            
            // First, request roadmap generation from FastAPI
            const fastApiResponse = await fetch('http://localhost:8000/generate-roadmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    degree: formData.degree,
                    country: formData.country,
                    language: formData.language,
                    include_paid: formData.isPaidCourse === "yes" ? true : false,
                    preferred_language: formData.preferredLanguage
                })
            });
            
            if (!fastApiResponse.ok) {
                throw new Error('Failed to start roadmap generation');
            }
            
            const { job_id } = await fastApiResponse.json();
            
            // Show initial success message that generation has started
            setShowSuccess(true);
            
            // Start polling with a reasonable interval
            let attempts = 0;
            let roadmapData = null;
            const maxAttempts = 20; // 20 minutes total (20 * 1 minute)
            const pollingInterval = 60000; // 1 minute between polls
            
            while (attempts < maxAttempts) {
                console.log(`Polling attempt ${attempts + 1}/${maxAttempts}`);
                
                try {
                    const pollResponse = await fetch(`http://localhost:8000/roadmap/${job_id}`);
                    if (!pollResponse.ok) {
                        console.error(`Poll request failed with status: ${pollResponse.status}`);
                        throw new Error('Failed to check roadmap status');
                    }
                    
                    const pollData = await pollResponse.json();
                    console.log('Poll response:', pollData);
                    
                    // If the response has a status field with value "processing", continue polling
                    if (pollData.status === "processing") {
                        console.log('Roadmap still processing, waiting 1 minute...');
                        await new Promise(resolve => setTimeout(resolve, pollingInterval));
                        attempts++;
                        continue;
                    }
                    
                    // If the response has a status field with value "failed", throw an error
                    if (pollData.status === "failed") {
                        throw new Error(pollData.error || 'Roadmap generation failed');
                    }
                    
                    // If we get here, either:
                    // 1. The response has no status field (completed job returns the roadmap directly)
                    // 2. The response has some other status we don't recognize
                    
                    // Check if it's a valid roadmap
                    if (isValidRoadmap(pollData)) {
                        console.log('Valid roadmap received, saving to database');
                        roadmapData = pollData;
                        break;
                    } else {
                        console.log('Response does not match expected roadmap schema, waiting...');
                        await new Promise(resolve => setTimeout(resolve, pollingInterval));
                        attempts++;
                    }
                } catch (pollError) {
                    console.error('Error during polling:', pollError);
                    await new Promise(resolve => setTimeout(resolve, pollingInterval));
                    attempts++;
                }
            }
            
            if (!roadmapData) {
                throw new Error('Roadmap generation timed out or failed to produce valid data');
            }
            
            // Save roadmap to user's database - use the roadmap data directly from FastAPI
            console.log('Saving roadmap to database:', roadmapData);
            
            // Save roadmap to user's database
            const backendResponse = await fetch('http://localhost:3001/roadmaps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(roadmapData)
            });
            
            if (!backendResponse.ok) {
                const data = await backendResponse.json();
                console.error('Backend error:', data);
                throw new Error(data.message || 'Failed to save roadmap');
            }

            const savedRoadmap = await backendResponse.json();
            
            // Wait for 1 second before redirecting
            setTimeout(() => {
                window.location.href = `/roadmaps`;
            }, 1000);
        } catch (error) {
            console.error('Error creating roadmap:', error);
            setShowSuccess(false);
            alert(error.message || 'Failed to create roadmap. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isValidRoadmap = (roadmap) => {
        try {
            console.log('Validating roadmap structure:', roadmap);
            
            // Check if response is an error or processing status
            if (roadmap.status === 'processing' || roadmap.error) {
                console.log('Roadmap is still processing or has an error');
                return false;
            }
            
            // Check for required top-level fields
            if (!roadmap.title || !roadmap.topic || !Array.isArray(roadmap.options)) {
                console.log('Missing required top-level fields');
                return false;
            }
            
            // Validate options array
            for (const option of roadmap.options) {
                if (!option.option_id || !option.option_name || !Array.isArray(option.topics)) {
                    console.log('Invalid option structure:', option);
                    return false;
                }
                
                // Validate topics within each option
                for (const topic of option.topics) {
                    if (topic.step_number === undefined || !topic.topic) {
                        console.log('Invalid topic structure:', topic);
                        return false;
                    }
                    
                    // Allow for missing thumbnail or URL but log it
                    if (!topic.thumbnail || !topic.url) {
                        console.log('Topic missing thumbnail or URL:', topic);
                    }
                }
            }
            
            console.log('Roadmap validation successful');
            return true;
        } catch (error) {
            console.error('Error validating roadmap:', error);
            return false;
        }
    };
    
    return (
        <div className="relative w-full min-h-screen text-white bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute top-1/3 -left-20 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full opacity-10 blur-3xl"></div>
            </div>
            
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-gray-900 bg-opacity-90 backdrop-blur-md border-b border-gray-700 shadow-lg">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold tracking-wide uppercase flex items-center">
                        <BiMap className="mr-2 text-blue-500" /> Map-It
                    </h1>
                </div>
                
                <button 
                    onClick={() => window.location.href = '/home'}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition"
                >
                    <FaArrowLeft /> Back to Home
                </button>
            </header>
            
            {/* Main Content */}
            <main className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl"
                >
                    {showSuccess ? (
                        <div className="text-center py-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl"
                            >
                                ✓
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-4">Roadmap Generation Started!</h2>
                            <p className="text-gray-300 mb-6">
                                We're creating your personalized roadmap. This process may take 10-12 minutes to complete.
                                You'll be able to view your roadmap in the "My Roadmaps" section once it's ready.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => window.location.href = '/roadmaps'}
                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition"
                                >
                                    Go to My Roadmaps
                                </button>
                                <button
                                    onClick={() => window.location.href = '/home'}
                                    className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition"
                                >
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold mb-2 text-center">Create Your Learning Roadmap</h1>
                            <p className="text-gray-400 mb-6 text-center">
                                Fill in the details below to generate a personalized learning roadmap
                            </p>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">
                                        Degree/Specialization
                                    </label>
                                    <input
                                        type="text"
                                        name="degree"
                                        value={formData.degree}
                                        onChange={handleChange}
                                        placeholder="e.g. Computer Science, Data Science, Web Development"
                                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="e.g. USA, India, UK"
                                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">
                                        Course Language
                                    </label>
                                    <input
                                        type="text"
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        placeholder="e.g. English, Spanish, Hindi"
                                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">
                                        Include Paid Courses?
                                    </label>
                                    <div className="flex gap-6 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="isPaidCourse"
                                                value="yes"
                                                checked={formData.isPaidCourse === "yes"}
                                                onChange={handleRadioChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                                required
                                            />
                                            <span>Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="isPaidCourse"
                                                value="no"
                                                checked={formData.isPaidCourse === "no"}
                                                onChange={handleRadioChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                            />
                                            <span>No</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">
                                        Preferred Coding Language (if applicable)
                                    </label>
                                    <input
                                        type="text"
                                        name="preferredLanguage"
                                        value={formData.preferredLanguage}
                                        onChange={handleChange}
                                        placeholder="e.g. Python, JavaScript, Java (leave empty if not applicable)"
                                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-gray-400 text-sm mt-1">Optional: Leave empty if not applicable</p>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition flex items-center justify-center gap-2 text-lg mt-8"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Generating Roadmap...
                                        </>
                                    ) : (
                                        'Generate Roadmap'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
