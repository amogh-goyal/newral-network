import { useState } from "react";
import { motion } from "framer-motion";
import { FaBars, FaTimes, FaChartPie, FaUser, FaCog, FaRoad, FaPlus, FaComments } from "react-icons/fa";
import { BiMap } from "react-icons/bi";

export default function Home() {
    const [showDashboard, setShowDashboard] = useState(false);

    return (
        <div className="relative w-full min-h-screen text-white overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
            {/* Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6 bg-opacity-80 backdrop-blur-md border-b border-gray-700">
                <button onClick={() => setShowDashboard(true)} className="text-xl hover:text-gray-400 transition">
                    <FaBars />
                </button>
                <h1 className="text-2xl font-bold tracking-wide uppercase flex items-center">
                    <BiMap className="mr-2 text-blue-500" /> Map-It
                </h1>
                <nav>
                    <ul className="flex gap-8 text-sm uppercase font-semibold">
                        <li>
                            <button className="hover:text-gray-400 transition">Profile</button>
                        </li>
                        <li>
                            <button className="hover:text-gray-400 transition">Settings</button>
                        </li>
                    </ul>
                </nav>
            </header>

            {/* Popup Dashboard (Left Side) */}
            {showDashboard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
                    <motion.div
                        className="w-64 h-full bg-gray-900 p-6 shadow-lg relative"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ duration: 0.3 }}
                    >
                        <button className="absolute top-4 right-4 text-white text-xl" onClick={() => setShowDashboard(false)}>
                            <FaTimes />
                        </button>
                        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer">
                                <FaPlus /> Add New Roadmap
                            </li>
                            <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer">
                                <FaRoad /> My Roadmaps
                            </li>
                            <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer">
                                <FaUser /> My Profile
                            </li>
                            <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer">
                                <FaCog /> Settings
                            </li>
                        </ul>
                    </motion.div>
                </div>
            )}

            {/* Main Content Section */}
            <main className="relative flex flex-col items-center justify-center text-center pt-32 px-6">
                <motion.h1
                    className="text-5xl font-extrabold mb-6 tracking-wide uppercase"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    Find Your Learning Path
                </motion.h1>
                <motion.p
                    className="text-lg mb-8 max-w-2xl text-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    Discover personalized roadmaps with curated courses from Udemy, YouTube, Coursera, and more.
                </motion.p>

                <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg">
                    <motion.button
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-lg rounded shadow-lg flex items-center justify-center gap-2 font-semibold uppercase tracking-wider flex-1"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        onClick={() => window.location.href = "/create-roadmap"}
                    >
                        <FaPlus /> Add New Roadmap
                    </motion.button>
                    <motion.button
                        className="bg-gray-700 hover:bg-gray-600 px-6 py-3 text-lg rounded shadow-lg flex items-center justify-center gap-2 font-semibold uppercase tracking-wider flex-1"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        onClick={() => window.location.href = "/my-roadmaps"}
                    >
                        <FaRoad /> See Roadmaps
                    </motion.button>
                </div>
            </main>

            {/* Popular Categories Section */}
            <section className="mt-16 px-6 text-center">
                <h2 className="text-3xl font-bold mb-4">Popular Learning Paths</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        className="p-6 bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h3 className="text-xl font-semibold mb-2">Web Development</h3>
                        <p className="text-gray-300">Master HTML, CSS, JavaScript and popular frameworks.</p>
                    </motion.div>
                    <motion.div
                        className="p-6 bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <h3 className="text-xl font-semibold mb-2">Data Science</h3>
                        <p className="text-gray-300">Learn Python, statistics, and machine learning algorithms.</p>
                    </motion.div>
                    <motion.div
                        className="p-6 bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                    >
                        <h3 className="text-xl font-semibold mb-2">Mobile Development</h3>
                        <p className="text-gray-300">Build iOS and Android apps with React Native or Flutter.</p>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="mt-16 px-6 text-center">
                <h2 className="text-3xl font-bold mb-8">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <span className="text-2xl font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Choose Topic</h3>
                        <p className="text-gray-300">Select your desired learning area, language, and budget</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <span className="text-2xl font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Get Roadmap</h3>
                        <p className="text-gray-300">Receive a personalized learning path with curated resources</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <span className="text-2xl font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
                        <p className="text-gray-300">Follow your roadmap and mark courses as completed</p>
                    </div>
                </div>
            </section>

            {/* Chatbot Button (Fixed Position) */}
            <div className="fixed bottom-8 right-8 z-40">
                <motion.button
                    className="bg-blue-600 hover:bg-blue-700 w-16 h-16 rounded-full shadow-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.location.href = "/chatbot"}
                >
                    <FaComments className="text-2xl" />
                </motion.button>
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-800 px-3 py-1 rounded text-sm">
                    Ask Cartographer
                </div>
            </div>

            {/* Footer */}
            <footer className="relative mt-16 py-6 bg-black bg-opacity-80 text-center text-sm text-gray-400 border-t border-gray-700">
                <p>&copy; {new Date().getFullYear()} RoadMap. All rights reserved.</p>
            </footer>
        </div>
    );
}