import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaRocket } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function BackgroundGrid() {
    const gridSize = 15;
    const cells = Array.from({ length: gridSize * gridSize });

    return (
        <div className="fixed top-0 left-0 w-screen h-screen pointer-events-auto" style={{ zIndex: 1 }}>
            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
            >
                {cells.map((_, index) => (
                    <div
                        key={index}
                        style={{
                            border: '0.5px solid rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function LandingPage() {
    const [showAboutUs, setShowAboutUs] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
            <BackgroundGrid />
            
            {/* Header */}
            <header className="relative w-full flex justify-between items-center p-6 bg-opacity-80 backdrop-blur-md z-50">
                <h1 className="text-2xl font-bold tracking-wide uppercase">Map-It</h1>
                <nav>
                    <button
                        onClick={() => setShowAboutUs(!showAboutUs)}
                        className="px-4 py-2 text-white hover:text-blue-400 transition-colors"
                    >
                        About Us
                    </button>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative z-20 max-w-2xl mx-auto px-6 pt-20 pb-12 pointer-events-auto">
                <motion.div
                    className="w-full p-8 bg-gray-800 bg-opacity-90 rounded-2xl shadow-lg text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.h1
                        className="text-4xl font-bold mb-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Welcome to Map-It
                    </motion.h1>
                    <motion.p
                        className="text-xl mb-8 text-gray-300"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        Optimize your learning experience with smart course recommendations that fit your every need!
                    </motion.p>
                    <div className="flex flex-col gap-4 max-w-md mx-auto">
                        <Link to="/signup">
                            <motion.button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FaRocket className="text-xl" /> Get Started
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </main>

            {/* About Us Modal */}
            {showAboutUs && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gray-800 p-8 rounded-2xl max-w-2xl w-full"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h2 className="text-2xl font-bold mb-4">About Us</h2>
                        <p className="text-gray-300 mb-6">
                            We are dedicated to revolutionizing the way you learn. Our platform uses advanced algorithms to create personalized learning paths that adapt to your unique needs and goals.
                        </p>
                        <button
                            onClick={() => setShowAboutUs(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
